import mongoose from "mongoose";
import FeeStructure from "../models/FeeStructure.js";
import CategoryDiscount from "../models/CategoryDiscount.js";
import StudentFeeAssignment from "../models/StudentFeeAssignment.js";
import Invoice from "../models/Invoice.js";
import Student from "../models/Student.js";
import FinanceAuditLog from "../models/FinanceAuditLog.js";

// Helper to safely convert Mongoose ID to string
const toIdStr = (id) => (id ? id.toString() : "");

/**
 * Automates fee structure calculations and assignment for a student.
 */
export const assignFeesToStudent = async (studentId, academicYearId, className, categoryName, streamName = "", sectionName = "") => {
  try {
    // 1. Look up the best matching FeeStructure (cascading fallback)
    let structure = await FeeStructure.findOne({
      academicYear: academicYearId,
      className,
      stream: streamName || "",
      sectionName: sectionName || "",
      status: "Active"
    });

    if (!structure && sectionName) {
      structure = await FeeStructure.findOne({
        academicYear: academicYearId,
        className,
        stream: streamName || "",
        sectionName: "",
        status: "Active"
      });
    }

    if (!structure && streamName) {
      structure = await FeeStructure.findOne({
        academicYear: academicYearId,
        className,
        stream: "",
        sectionName: "",
        status: "Active"
      });
    }

    if (!structure) {
      // Return null or throw custom error if structure not found
      return null;
    }

    // 2. Fetch all discounts configured for this student's category
    const discounts = await CategoryDiscount.find({
      categoryName,
      status: "Active"
    }).populate("feeCategory").lean();

    // 3. Compute base items, discount deductions, and final amounts
    const feeItems = [];
    let totalBase = 0;
    let totalDiscount = 0;
    let totalPayable = 0;

    for (const item of structure.feeItems) {
      const baseAmt = item.amount;
      let discAmt = 0;

      // Find matching discount
      // Checks for full waiver, category percentage/fixed, or specific fee head discount
      const fullWaiver = discounts.find(d => d.discountType === "Full Waiver");
      const specificHead = discounts.find(d => d.discountType === "Fee Head Specific" && d.feeCategory && toIdStr(d.feeCategory._id || d.feeCategory) === toIdStr(item.feeCategory));
      const categoryGeneralPercentage = discounts.find(d => d.discountType === "Percentage" && !d.feeCategory);
      const categoryGeneralFixed = discounts.find(d => d.discountType === "Fixed Amount" && !d.feeCategory);

      if (fullWaiver) {
        discAmt = baseAmt;
      } else if (specificHead) {
        discAmt = (specificHead.discountValue / 100) * baseAmt;
      } else if (categoryGeneralPercentage) {
        discAmt = (categoryGeneralPercentage.discountValue / 100) * baseAmt;
      } else if (categoryGeneralFixed) {
        discAmt = categoryGeneralFixed.discountValue;
      }

      // Cap discount to base amount
      if (discAmt > baseAmt) discAmt = baseAmt;
      if (discAmt < 0) discAmt = 0;

      const finalAmt = baseAmt - discAmt;

      // Find Category details to assign name
      const categoryDoc = await mongoose.model("FeeCategory").findById(item.feeCategory).lean();
      const feeCategoryName = categoryDoc ? categoryDoc.name : "Fee Head Item";

      feeItems.push({
        feeCategory: item.feeCategory,
        name: feeCategoryName,
        baseAmount: baseAmt,
        discountAmount: discAmt,
        finalAmount: finalAmt
      });

      totalBase += baseAmt;
      totalDiscount += discAmt;
      totalPayable += finalAmt;
    }

    // 4. Delete existing assignments/unpaid invoices for this student/AY to prevent duplicates
    await StudentFeeAssignment.deleteOne({ student: studentId, academicYear: academicYearId });
    await Invoice.deleteMany({ student: studentId, feeAssignment: { $ne: null }, status: "Unpaid" });

    // 5. Create new StudentFeeAssignment
    const assignment = new StudentFeeAssignment({
      student: studentId,
      academicYear: academicYearId,
      feeStructure: structure._id,
      className,
      sectionName,
      category: categoryName,
      feeItems,
      totalBaseAmount: totalBase,
      totalDiscountAmount: totalDiscount,
      totalPayable,
      totalPaid: 0,
      status: totalPayable === 0 ? "Paid" : "Unpaid"
    });

    await assignment.save();

    // 6. Generate installment Invoices
    let numInstallments = 1;
    let nameInstallments = ["Annual Payment"];

    if (structure.installments === "Half-Yearly") {
      numInstallments = 2;
      nameInstallments = ["1st Half Term Payment", "2nd Half Term Payment"];
    } else if (structure.installments === "Quarterly") {
      numInstallments = 4;
      nameInstallments = ["1st Quarter Term Payment", "2nd Quarter Term Payment", "3rd Quarter Term Payment", "4th Quarter Term Payment"];
    } else if (structure.installments === "Monthly") {
      numInstallments = 12;
      nameInstallments = Array.from({ length: 12 }, (_, i) => `Monthly installment ${i + 1}`);
    }

    const currentYear = new Date().getFullYear();
    const studentDoc = await Student.findById(studentId).lean();
    const studentSeq = (studentDoc && studentDoc.studentId && studentDoc.studentId.replace(/[^0-9]/g, "")) || studentId.toString().slice(-6);

    for (let i = 0; i < numInstallments; i++) {
      const invoiceNumber = `INV-${currentYear}-${studentSeq}-INST-${i + 1}`;

      // Distribute amount, discount, and breakdowns equally
      const instAmount = Number((totalPayable / numInstallments).toFixed(2));
      const instBase = Number((totalBase / numInstallments).toFixed(2));
      const instDiscount = Number((totalDiscount / numInstallments).toFixed(2));

      const instBreakdown = feeItems.map(item => ({
        feeCategory: item.feeCategory,
        name: item.name,
        baseAmount: Number((item.baseAmount / numInstallments).toFixed(2)),
        discountAmount: Number((item.discountAmount / numInstallments).toFixed(2)),
        finalAmount: Number((item.finalAmount / numInstallments).toFixed(2))
      }));

      // Calculate due dates sequentially (e.g. 0, 3, 6, 9 months / 1 month gap)
      const monthsGap = structure.installments === "Monthly" ? 1 : structure.installments === "Quarterly" ? 3 : structure.installments === "Half-Yearly" ? 6 : 12;
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + (i * monthsGap));

      const invoice = new Invoice({
        invoiceNumber,
        student: studentId,
        amount: instBase,
        dueDate,
        status: instAmount === 0 ? "Paid" : "Unpaid",
        feeStructureName: structure.name,
        feeAssignment: assignment._id,
        installmentName: nameInstallments[i] || `Installment ${i + 1}`,
        discountAmount: instDiscount,
        fineAmount: 0,
        concessionAmount: 0,
        payableAmount: instAmount,
        paidAmount: instAmount === 0 ? instAmount : 0,
        feeBreakdown: instBreakdown
      });

      await invoice.save();
    }

    // Log Finance Audit Log
    const audit = new FinanceAuditLog({
      action: "FEE_ASSIGNED",
      performedBy: studentId, // System automation log
      details: `System automatically assigned Fee Structure "${structure.name}" to student (${studentDoc?.firstName} ${studentDoc?.lastName}) under Category: ${categoryName}. Total Payable: ${totalPayable}`
    });
    await audit.save();

    return assignment;
  } catch (err) {
    console.error("Error in assignFeesToStudent service:", err);
    throw err;
  }
};
