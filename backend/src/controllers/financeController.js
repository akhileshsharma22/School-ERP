import mongoose from "mongoose";
import FeeCategory from "../models/FeeCategory.js";
import CategoryDiscount from "../models/CategoryDiscount.js";
import FeeStructure from "../models/FeeStructure.js";
import StudentFeeAssignment from "../models/StudentFeeAssignment.js";
import Invoice from "../models/Invoice.js";
import FeeReceipt from "../models/FeeReceipt.js";
import FeeRefund from "../models/FeeRefund.js";
import FinanceAuditLog from "../models/FinanceAuditLog.js";
import Student from "../models/Student.js";
import AcademicYear from "../models/AcademicYear.js";
import Admission from "../models/Admission.js";
import { assignFeesToStudent } from "../services/financeService.js";

// Helper to safely convert Mongoose ID to string
const toIdStr = (id) => (id ? id.toString() : "");

// Generate custom unique audit logs helper
const logFinanceAudit = async (action, performedBy, details, req = null) => {
  const ipAddress = req ? (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "") : "";
  const log = new FinanceAuditLog({
    action,
    performedBy,
    details,
    ipAddress
  });
  await log.save();
};

/**
 * FEE CATEGORIES (HEADS)
 */
export const getFeeCategories = async (req, res) => {
  try {
    const categories = await FeeCategory.find().sort({ name: 1 });
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createFeeCategory = async (req, res) => {
  try {
    const { name, description, amount, frequency, isMandatory, status } = req.body;
    if (!name || amount === undefined) {
      return res.status(400).json({ success: false, message: "Name and Amount are required." });
    }

    const exists = await FeeCategory.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (exists) {
      return res.status(400).json({ success: false, message: "Fee head category name already exists." });
    }

    const feeCategory = new FeeCategory({
      name: name.trim(),
      description,
      amount: Number(amount),
      frequency,
      isMandatory: isMandatory !== undefined ? !!isMandatory : true,
      status: status || "Active"
    });

    await feeCategory.save();
    await logFinanceAudit("FEE_CATEGORY_CREATED", req.user._id, `Created Fee Category: ${name} with base amount: ${amount}`, req);

    return res.status(201).json({ success: true, message: "Fee head category created successfully.", feeCategory });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, amount, frequency, isMandatory, status } = req.body;

    const feeCategory = await FeeCategory.findById(id);
    if (!feeCategory) {
      return res.status(404).json({ success: false, message: "Fee head category not found." });
    }

    if (name && name.trim().toLowerCase() !== feeCategory.name.toLowerCase()) {
      const exists = await FeeCategory.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
      if (exists) {
        return res.status(400).json({ success: false, message: "Fee head category name already exists." });
      }
      feeCategory.name = name.trim();
    }

    if (description !== undefined) feeCategory.description = description;
    if (amount !== undefined) feeCategory.amount = Number(amount);
    if (frequency !== undefined) feeCategory.frequency = frequency;
    if (isMandatory !== undefined) feeCategory.isMandatory = !!isMandatory;
    if (status !== undefined) feeCategory.status = status;

    await feeCategory.save();
    await logFinanceAudit("FEE_CATEGORY_UPDATED", req.user._id, `Updated Fee Category ID: ${id} (${feeCategory.name})`, req);

    return res.status(200).json({ success: true, message: "Fee head category updated successfully.", feeCategory });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const isUsed = await FeeStructure.findOne({ "feeItems.feeCategory": id });
    if (isUsed) {
      return res.status(400).json({ success: false, message: "Cannot delete fee category because it is actively used in one or more Fee Structures." });
    }

    const feeCategory = await FeeCategory.findByIdAndDelete(id);
    if (!feeCategory) {
      return res.status(404).json({ success: false, message: "Fee head category not found." });
    }

    await logFinanceAudit("FEE_CATEGORY_DELETED", req.user._id, `Deleted Fee Category: ${feeCategory.name}`, req);
    return res.status(200).json({ success: true, message: "Fee head category deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * CATEGORY BASED DISCOUNT SYSTEM
 */
export const getDiscounts = async (req, res) => {
  try {
    const discounts = await CategoryDiscount.find().populate("feeCategory").sort({ categoryName: 1 });
    return res.status(200).json({ success: true, discounts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createDiscount = async (req, res) => {
  try {
    const { categoryName, discountType, discountValue, feeCategory, description, status } = req.body;
    if (!categoryName || !discountType || discountValue === undefined) {
      return res.status(400).json({ success: false, message: "Category Name, Discount Type, and Discount Value are required." });
    }

    if (discountType === "Percentage" && Number(discountValue) > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%." });
    }

    // Unique combination check
    const query = { categoryName, discountType };
    if (discountType === "Fee Head Specific") {
      if (!feeCategory) return res.status(400).json({ success: false, message: "Fee Head is required for fee-specific discounts." });
      query.feeCategory = feeCategory;
    } else {
      query.feeCategory = null;
    }

    const exists = await CategoryDiscount.findOne(query);
    if (exists) {
      return res.status(400).json({ success: false, message: "This discount mapping rule already exists for this category." });
    }

    const discount = new CategoryDiscount({
      categoryName,
      discountType,
      discountValue: Number(discountValue),
      feeCategory: discountType === "Fee Head Specific" ? feeCategory : null,
      description,
      status: status || "Active"
    });

    await discount.save();
    await logFinanceAudit("DISCOUNT_APPLIED", req.user._id, `Created Category Discount for ${categoryName}: ${discountType} (${discountValue})`, req);

    return res.status(201).json({ success: true, message: "Category discount created successfully.", discount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryName, discountType, discountValue, feeCategory, description, status } = req.body;

    const discount = await CategoryDiscount.findById(id);
    if (!discount) {
      return res.status(404).json({ success: false, message: "Category discount mapping not found." });
    }

    if (categoryName !== undefined) discount.categoryName = categoryName;
    if (discountType !== undefined) discount.discountType = discountType;
    if (discountValue !== undefined) discount.discountValue = Number(discountValue);
    if (feeCategory !== undefined) discount.feeCategory = discountType === "Fee Head Specific" ? feeCategory : null;
    if (description !== undefined) discount.description = description;
    if (status !== undefined) discount.status = status;

    if (discount.discountType === "Percentage" && discount.discountValue > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%." });
    }

    await discount.save();
    await logFinanceAudit("DISCOUNT_APPLIED", req.user._id, `Updated Category Discount ID: ${id}`, req);

    return res.status(200).json({ success: true, message: "Category discount updated successfully.", discount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await CategoryDiscount.findByIdAndDelete(id);
    if (!discount) {
      return res.status(404).json({ success: false, message: "Category discount not found." });
    }

    await logFinanceAudit("DISCOUNT_APPLIED", req.user._id, `Deleted Category Discount ID: ${id} (${discount.categoryName})`, req);
    return res.status(200).json({ success: true, message: "Category discount mapping deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * FEE STRUCTURES
 */
export const getStructures = async (req, res) => {
  try {
    const structures = await FeeStructure.find()
      .populate("academicYear")
      .populate("feeItems.feeCategory")
      .sort({ className: 1 });
    return res.status(200).json({ success: true, structures });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createStructure = async (req, res) => {
  try {
    const { name, academicYear, className, stream, sectionName, feeItems, installments, lateFineRule, status } = req.body;
    if (!name || !academicYear || !className || !feeItems || !feeItems.length) {
      return res.status(400).json({ success: false, message: "Name, Academic Year, Class, and Fee Items are required." });
    }

    const uniqueQuery = {
      academicYear,
      className,
      stream: stream || "",
      sectionName: sectionName || ""
    };
    const exists = await FeeStructure.findOne(uniqueQuery);
    if (exists) {
      return res.status(400).json({ success: false, message: `Fee Structure already exists for this Class combination: ${className} ${stream || ""} ${sectionName || ""}.` });
    }

    const structure = new FeeStructure({
      name,
      academicYear,
      className,
      stream: stream || "",
      sectionName: sectionName || "",
      feeItems: feeItems.map(item => ({ feeCategory: item.feeCategory, amount: Number(item.amount) })),
      installments: installments || "Annual",
      lateFineRule: lateFineRule || { fineType: "None", fineAmount: 0, graceDays: 0 },
      status: status || "Active"
    });

    await structure.save();
    await logFinanceAudit("FEE_STRUCTURE_CREATED", req.user._id, `Created Fee Structure: ${name} for class: ${className}`, req);

    return res.status(201).json({ success: true, message: "Fee Structure created successfully.", structure });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, academicYear, className, stream, sectionName, feeItems, installments, lateFineRule, status } = req.body;

    const structure = await FeeStructure.findById(id);
    if (!structure) {
      return res.status(404).json({ success: false, message: "Fee Structure not found." });
    }

    if (name !== undefined) structure.name = name;
    if (academicYear !== undefined) structure.academicYear = academicYear;
    if (className !== undefined) structure.className = className;
    if (stream !== undefined) structure.stream = stream || "";
    if (sectionName !== undefined) structure.sectionName = sectionName || "";
    if (feeItems !== undefined) {
      structure.feeItems = feeItems.map(item => ({ feeCategory: item.feeCategory, amount: Number(item.amount) }));
    }
    if (installments !== undefined) structure.installments = installments;
    if (lateFineRule !== undefined) structure.lateFineRule = lateFineRule;
    if (status !== undefined) structure.status = status;

    await structure.save();
    await logFinanceAudit("FEE_STRUCTURE_UPDATED", req.user._id, `Updated Fee Structure ID: ${id} (${structure.name})`, req);

    return res.status(200).json({ success: true, message: "Fee Structure updated successfully.", structure });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const isAssigned = await StudentFeeAssignment.findOne({ feeStructure: id });
    if (isAssigned) {
      return res.status(400).json({ success: false, message: "Cannot delete Fee Structure because it is already assigned to students." });
    }

    const structure = await FeeStructure.findByIdAndDelete(id);
    if (!structure) {
      return res.status(404).json({ success: false, message: "Fee Structure not found." });
    }

    await logFinanceAudit("FEE_STRUCTURE_DELETED", req.user._id, `Deleted Fee Structure: ${structure.name}`, req);
    return res.status(200).json({ success: true, message: "Fee Structure deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * STUDENT FEE ASSIGNMENTS
 */
export const getAssignments = async (req, res) => {
  try {
    const { academicYear, className, sectionName, category, feeStructure, status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (academicYear && mongoose.Types.ObjectId.isValid(academicYear)) filter.academicYear = academicYear;
    if (className) filter.className = className;
    if (sectionName) filter.sectionName = sectionName;
    if (category) filter.category = category;
    if (feeStructure && mongoose.Types.ObjectId.isValid(feeStructure)) filter.feeStructure = feeStructure;

    if (status) {
      if (status === "Overdue") {
        const today = new Date();
        const overdueInvoiceAssignments = await Invoice.find({
          status: { $in: ["Unpaid", "Partially Paid"] },
          dueDate: { $lt: today }
        }).distinct("feeAssignment");
        filter._id = { $in: overdueInvoiceAssignments };
      } else if (status !== "All") {
        filter.status = status;
      }
    }

    if (search) {
      const studentIds = await Student.find({
        $or: [
          { admissionNo: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { fatherMobile: { $regex: search, $options: "i" } },
          { motherMobile: { $regex: search, $options: "i" } }
        ]
      }).distinct("_id");
      filter.student = { $in: studentIds };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [assignments, total] = await Promise.all([
      StudentFeeAssignment.find(filter)
        .populate("student", "studentId admissionNo firstName lastName category fatherMobile motherMobile className sectionName")
        .populate("academicYear", "name")
        .populate("feeStructure", "name installments")
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      StudentFeeAssignment.countDocuments(filter)
    ]);

    // Populate dynamic due dates
    const assignmentsWithDueDate = await Promise.all(assignments.map(async (as) => {
      const invoices = await Invoice.find({ feeAssignment: as._id }).sort({ dueDate: 1 }).lean();
      const unpaidInvoice = invoices.find(inv => inv.status !== "Paid");
      const dueDate = unpaidInvoice ? unpaidInvoice.dueDate : (invoices.length > 0 ? invoices[invoices.length - 1].dueDate : null);
      return {
        ...as,
        dueDate
      };
    }));

    // Aggregate dynamic KPIs for dashboard cards
    const kpiAggregation = await StudentFeeAssignment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          expectedCollection: { $sum: "$totalPayable" },
          totalCollected: { $sum: "$totalPaid" }
        }
      }
    ]);
    const expectedCollection = kpiAggregation[0]?.expectedCollection || 0;
    const totalCollected = kpiAggregation[0]?.totalCollected || 0;
    const outstandingAmount = expectedCollection - totalCollected;

    // Today's collection
    const matchingStudentIds = await StudentFeeAssignment.find(filter).distinct("student");
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayReceiptsAggregation = await FeeReceipt.aggregate([
      {
        $match: {
          student: { $in: matchingStudentIds },
          status: "Success",
          paymentDate: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          todayCollection: { $sum: "$amountPaid" }
        }
      }
    ]);
    const todaysCollection = todayReceiptsAggregation[0]?.todayCollection || 0;

    // Overdue accounts count
    const overdueInvoiceAssignmentsForFilter = await Invoice.find({
      feeAssignment: { $in: await StudentFeeAssignment.find(filter).distinct("_id") },
      status: { $in: ["Unpaid", "Partially Paid"] },
      dueDate: { $lt: new Date() }
    }).distinct("feeAssignment");
    const overdueAccountsCount = overdueInvoiceAssignmentsForFilter.length;

    return res.status(200).json({
      success: true,
      assignments: assignmentsWithDueDate,
      total,
      page: Number(page),
      limit: Number(limit),
      kpis: {
        totalAssignedStudents: total,
        expectedCollection,
        totalCollected,
        outstandingAmount,
        todaysCollection,
        overdueAccountsCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkTriggerAssignments = async (req, res) => {
  try {
    const { academicYearId, className } = req.body;
    console.log("Triggering bulk fee assignments for academicYear:", academicYearId, "class:", className);

    // 1. Verify Active Academic Year exists
    if (!academicYearId || !mongoose.Types.ObjectId.isValid(academicYearId)) {
      console.error("Bulk Assignment Error: Invalid or missing Academic Year ID.");
      return res.status(400).json({ success: false, message: "A valid Academic Year is required." });
    }

    const activeAY = await AcademicYear.findById(academicYearId);
    if (!activeAY) {
      console.error("Bulk Assignment Error: Active Academic Year session not found in database.");
      return res.status(400).json({ success: false, message: "No active Academic Year session found." });
    }

    // 2. Verify Categories exist
    const categoriesCount = await FeeCategory.countDocuments();
    if (categoriesCount === 0) {
      console.error("Bulk Assignment Error: No Fee Categories configured in database.");
      return res.status(400).json({ success: false, message: "No Fee Categories exist in the system database. Please configure categories first." });
    }

    // 3. Verify Fee Structures exist
    const structuresCount = await FeeStructure.countDocuments({ academicYear: academicYearId, status: "Active" });
    if (structuresCount === 0) {
      console.error("Bulk Assignment Error: No active Fee Structures found for AY:", academicYearId);
      return res.status(400).json({ success: false, message: "No active Fee Structures configured for the selected Academic Year." });
    }

    // 4. Verify Approved Admissions exist
    const approvedAdmissionsCount = await Admission.countDocuments({ approvalStatus: "Approved" });
    if (approvedAdmissionsCount === 0) {
      console.error("Bulk Assignment Warning: No Approved Admissions found in system.");
      return res.status(400).json({ success: false, message: "No Approved Admissions found in the system database." });
    }

    // 5. Verify Students exist
    const studentQuery = { status: "Active" };
    if (className) studentQuery.className = className;

    const students = await Student.find(studentQuery);
    if (students.length === 0) {
      console.error("Bulk Assignment Error: No active students found matching class filter:", className);
      return res.status(400).json({ success: false, message: `No active students found for Class ${className || "all"}` });
    }

    let assignedCount = 0;
    let skippedMissingDataCount = 0;
    let alreadyAssignedCount = 0;
    const missingStructureClasses = new Set();
    const missingDataInfo = [];

    for (const student of students) {
      // Step 6: Verify student data completeness
      if (!student.className || !student.category || !student.academicYear) {
        skippedMissingDataCount++;
        missingDataInfo.push(`${student.firstName} ${student.lastName} (Missing class/category/academicYear)`);
        console.warn(`Skipping student ${student.firstName} ${student.lastName} due to missing fields class/category/academicYear`);
        continue;
      }

      // Step 7: Verify duplicate assignment logic
      const exists = await StudentFeeAssignment.findOne({ student: student._id, academicYear: academicYearId });
      if (exists) {
        alreadyAssignedCount++;
        continue;
      }

      // Step 4: Verify Fee Structure Lookup
      try {
        const assigned = await assignFeesToStudent(
          student._id,
          academicYearId,
          student.className,
          student.category || "General",
          student.stream || "",
          student.sectionName || ""
        );
        if (assigned) {
          assignedCount++;
        } else {
          console.warn(`No fee structure configured for student ${student.firstName} ${student.lastName} (Class ${student.className})`);
          missingStructureClasses.add(student.className);
        }
      } catch (e) {
        console.error(`Error in assignFeesToStudent service call for student ${student.firstName} ${student.lastName}:`, e);
        console.error(e.stack);
        missingStructureClasses.add(student.className);
      }
    }

    // Check outputs
    if (alreadyAssignedCount === students.length) {
      console.log("Bulk Trigger: Assignments already generated for all active students.");
      return res.status(400).json({ success: false, message: "Assignments already generated" });
    }

    if (assignedCount === 0 && missingStructureClasses.size > 0) {
      const classesList = Array.from(missingStructureClasses).join(", ");
      console.error(`Bulk Trigger Error: No assignments generated. Missing structures for Class(es): ${classesList}`);
      return res.status(400).json({ success: false, message: `No fee structure configured for Class ${classesList}` });
    }

    // Safely perform log
    const performerId = req.user?._id || null;
    await logFinanceAudit("FEE_ASSIGNED_BULK", performerId, `Triggered bulk fee assignments: ${assignedCount} succeeded, ${alreadyAssignedCount} already existed, ${missingStructureClasses.size} classes missing structures.`, req);

    let msg = `Bulk assignment completed. Succeeded: ${assignedCount} students.`;
    if (alreadyAssignedCount > 0) msg += ` Already assigned: ${alreadyAssignedCount}.`;
    if (missingStructureClasses.size > 0) {
      msg += ` Skipped missing structures for Class(es): ${Array.from(missingStructureClasses).join(", ")}.`;
    }

    return res.status(200).json({
      success: true,
      message: msg,
      assignedCount,
      alreadyAssignedCount,
      skippedMissingDataCount,
      missingDataInfo
    });
  } catch (error) {
    console.error("Generate Assignment Error:", error);
    console.error(error.stack);
    return res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};


export const triggerStudentAssignment = async (req, res) => {
  try {
    const { studentId, academicYearId } = req.body;
    if (!studentId || !academicYearId) {
      return res.status(400).json({ success: false, message: "Student and Academic Year are required." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const assignment = await assignFeesToStudent(
      student._id,
      academicYearId,
      student.className,
      student.category || "General",
      student.stream || "",
      student.sectionName || ""
    );

    if (!assignment) {
      return res.status(400).json({ success: false, message: "Fee Structure template matching student details not found. Please set up Fee Structure first." });
    }

    await logFinanceAudit("FEE_ASSIGNED", req.user._id, `Manually triggered fee assignment for student ${student.firstName} ${student.lastName}`, req);
    return res.status(200).json({ success: true, message: "Fees assigned successfully.", assignment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * INVOICES (DUE MANAGEMENT & PAYMENT COLLECTION)
 */
export const getInvoices = async (req, res) => {
  try {
    const { student, status, className, academicYear, search } = req.query;
    const filter = {};

    if (student && mongoose.Types.ObjectId.isValid(student)) filter.student = student;
    if (status) filter.status = status;
    if (className) filter.className = className;
    if (academicYear && mongoose.Types.ObjectId.isValid(academicYear)) filter.academicYear = academicYear;

    if (search) {
      const studentIds = await Student.find({
        $or: [
          { admissionNo: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } }
        ]
      }).distinct("_id");
      filter.student = { $in: studentIds };
    }

    // Dynamic Fine Calculation Check
    const invoices = await Invoice.find(filter)
      .populate("student", "firstName lastName admissionNo className sectionName category")
      .lean();

    const updatedInvoices = [];
    const today = new Date();

    for (const inv of invoices) {
      let isChanged = false;
      let fineAmt = inv.fineAmount || 0;

      // Unpaid or Partially Paid invoices overdue for fine calculation
      if ((inv.status === "Unpaid" || inv.status === "Partially Paid") && inv.dueDate && new Date(inv.dueDate) < today) {
        // Find fee assignment rule
        const assignment = await StudentFeeAssignment.findById(inv.feeAssignment).populate("feeStructure").lean();
        if (assignment && assignment.feeStructure && assignment.feeStructure.lateFineRule) {
          const rule = assignment.feeStructure.lateFineRule;
          if (rule.fineType && rule.fineType !== "None") {
            const timeDiff = today.getTime() - new Date(inv.dueDate).getTime();
            const daysOverdue = Math.floor(timeDiff / (1000 * 3600 * 24));
            const activeDays = daysOverdue - rule.graceDays;

            if (activeDays > 0) {
              let calculatedFine = 0;
              if (rule.fineType === "Per Day") {
                calculatedFine = activeDays * rule.fineAmount;
              } else if (rule.fineType === "Per Week") {
                calculatedFine = Math.ceil(activeDays / 7) * rule.fineAmount;
              } else if (rule.fineType === "Fixed") {
                calculatedFine = rule.fineAmount;
              } else if (rule.fineType === "Percentage") {
                calculatedFine = (rule.fineAmount / 100) * inv.amount;
              }

              if (calculatedFine !== inv.fineAmount) {
                fineAmt = calculatedFine;
                isChanged = true;
              }
            }
          }
        }
      }

      if (isChanged) {
        const payableAmount = inv.amount + fineAmt - inv.discountAmount - inv.concessionAmount;
        await Invoice.updateOne(
          { _id: inv._id },
          { $set: { fineAmount: fineAmt, payableAmount: payableAmount } }
        );
        inv.fineAmount = fineAmt;
        inv.payableAmount = payableAmount;
      }
      updatedInvoices.push(inv);
    }

    return res.status(200).json({ success: true, invoices: updatedInvoices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id)
      .populate("student", "studentId admissionNo firstName lastName className sectionName category")
      .lean();

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const applyConcession = async (req, res) => {
  try {
    const { id } = req.params;
    const { concessionAmount, reason } = req.body;
    if (concessionAmount === undefined || concessionAmount < 0) {
      return res.status(400).json({ success: false, message: "Concession amount must be a positive number." });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    if (invoice.status === "Paid") {
      return res.status(400).json({ success: false, message: "Cannot apply concessions to already paid invoice." });
    }

    // Limit concession to remaining balance
    const remainingBalance = invoice.payableAmount - invoice.paidAmount;
    if (concessionAmount > remainingBalance) {
      return res.status(400).json({ success: false, message: `Concession amount exceeds remaining balance of ${remainingBalance}.` });
    }

    invoice.concessionAmount = Number(concessionAmount);
    invoice.payableAmount = invoice.amount + invoice.fineAmount - invoice.discountAmount - Number(concessionAmount);

    if (invoice.paidAmount >= invoice.payableAmount) {
      invoice.status = "Paid";
    }

    await invoice.save();

    await logFinanceAudit(
      "CONCESSION_APPLIED",
      req.user._id,
      `Applied fee concession of ${concessionAmount} to invoice ${invoice.invoiceNumber}. Reason: ${reason || "Not specified"}`,
      req
    );

    return res.status(200).json({ success: true, message: "Fee concession applied successfully.", invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const collectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentMode, transactionId, remarks } = req.body;

    if (!amountPaid || Number(amountPaid) <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount paid." });
    }

    const invoice = await Invoice.findById(id).populate("student");
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    const remainingPayable = invoice.payableAmount - invoice.paidAmount;
    if (Number(amountPaid) > remainingPayable + 0.05) { // Small buffer for float issues
      return res.status(400).json({ success: false, message: `Over collection not allowed. Balance remaining: ${remainingPayable}` });
    }

    // Register receipt
    const year = new Date().getFullYear();
    const countReceipts = await FeeReceipt.countDocuments();
    const receiptNumber = `REC-${year}-${String(countReceipts + 1).padStart(4, "0")}`;

    const receipt = new FeeReceipt({
      receiptNumber,
      student: invoice.student._id,
      invoice: invoice._id,
      amountPaid: Number(amountPaid),
      paymentMode,
      transactionId: transactionId || "",
      receivedBy: req.user._id,
      remarks: remarks || "",
      status: "Success"
    });
    await receipt.save();

    // Update invoice balance
    invoice.paidAmount = Number((invoice.paidAmount + Number(amountPaid)).toFixed(2));
    if (invoice.paidAmount >= invoice.payableAmount - 0.05) {
      invoice.status = "Paid";
      invoice.paidAmount = invoice.payableAmount; // snap to match
    } else {
      invoice.status = "Partially Paid";
    }
    await invoice.save();

    // Update StudentFeeAssignment parent totals
    if (invoice.feeAssignment) {
      const assignment = await StudentFeeAssignment.findById(invoice.feeAssignment);
      if (assignment) {
        const invoicesList = await Invoice.find({ feeAssignment: assignment._id });
        const totalPaid = invoicesList.reduce((sum, inv) => sum + inv.paidAmount, 0);
        assignment.totalPaid = Number(totalPaid.toFixed(2));

        if (assignment.totalPaid >= assignment.totalPayable - 0.05) {
          assignment.status = "Paid";
        } else if (assignment.totalPaid > 0) {
          assignment.status = "Partially Paid";
        }
        await assignment.save();
      }
    }

    await logFinanceAudit(
      "PAYMENT_COLLECTED",
      req.user._id,
      `Collected fee payment of ${amountPaid} for invoice ${invoice.invoiceNumber}. Receipt generated: ${receiptNumber}`,
      req
    );

    return res.status(200).json({ success: true, message: "Payment collected and receipt generated.", receipt, invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * RECEIPTS & REFUNDS
 */
export const getReceipts = async (req, res) => {
  try {
    const { student } = req.query;
    const filter = {};
    if (student && mongoose.Types.ObjectId.isValid(student)) filter.student = student;

    const receipts = await FeeReceipt.find(filter)
      .populate("student", "firstName lastName admissionNo className sectionName")
      .populate("invoice")
      .populate("receivedBy", "fullName")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, receipts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const refundReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason, paymentMode } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Valid refund amount is required." });
    }

    const receipt = await FeeReceipt.findById(id).populate("invoice");
    if (!receipt) {
      return res.status(404).json({ success: false, message: "Receipt not found." });
    }

    if (receipt.status === "Refunded") {
      return res.status(400).json({ success: false, message: "Receipt payment is already refunded." });
    }

    if (Number(amount) > receipt.amountPaid) {
      return res.status(400).json({ success: false, message: `Refund amount cannot exceed amount originally paid (${receipt.amountPaid}).` });
    }

    const year = new Date().getFullYear();
    const countRefunds = await FeeRefund.countDocuments();
    const refundNumber = `RFD-${year}-${String(countRefunds + 1).padStart(4, "0")}`;

    const refund = new FeeRefund({
      refundNumber,
      receipt: receipt._id,
      student: receipt.student,
      amount: Number(amount),
      paymentMode: paymentMode || "Cash",
      reason,
      refundedBy: req.user._id
    });
    await refund.save();

    // Update receipt status
    receipt.status = "Refunded";
    await receipt.save();

    // Revert invoice balances
    const invoice = receipt.invoice;
    invoice.paidAmount = Number((invoice.paidAmount - Number(amount)).toFixed(2));
    if (invoice.paidAmount < 0) invoice.paidAmount = 0;

    if (invoice.paidAmount === 0) {
      invoice.status = "Unpaid";
    } else {
      invoice.status = "Partially Paid";
    }
    await invoice.save();

    // Revert parent StudentFeeAssignment totals
    if (invoice.feeAssignment) {
      const assignment = await StudentFeeAssignment.findById(invoice.feeAssignment);
      if (assignment) {
        const invoicesList = await Invoice.find({ feeAssignment: assignment._id });
        const totalPaid = invoicesList.reduce((sum, inv) => sum + inv.paidAmount, 0);
        assignment.totalPaid = Number(totalPaid.toFixed(2));

        if (assignment.totalPaid === 0) {
          assignment.status = "Unpaid";
        } else {
          assignment.status = "Partially Paid";
        }
        await assignment.save();
      }
    }

    await logFinanceAudit(
      "REFUND_ISSUED",
      req.user._id,
      `Issued payment refund of ${amount} for receipt ${receipt.receiptNumber}. Refund Doc: ${refundNumber}`,
      req
    );

    return res.status(200).json({ success: true, message: "Refund processed successfully.", refund, receipt });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DASHBOARD KPIs & REPORT AGGREGATIONS
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Sum collections
    const activeReceipts = await FeeReceipt.find({ status: "Success" }).lean();
    const totalCollection = activeReceipts.reduce((sum, r) => sum + r.amountPaid, 0);

    const monthlyCollection = activeReceipts
      .filter(r => new Date(r.paymentDate) >= startOfMonth)
      .reduce((sum, r) => sum + r.amountPaid, 0);

    const dailyCollection = activeReceipts
      .filter(r => new Date(r.paymentDate) >= today)
      .reduce((sum, r) => sum + r.amountPaid, 0);

    // Outstanding dues
    const unpaidInvoices = await Invoice.find({ status: { $in: ["Unpaid", "Partially Paid"] } }).lean();
    const outstandingDues = unpaidInvoices.reduce((sum, inv) => sum + (inv.payableAmount - inv.paidAmount), 0);

    // Discounts applied
    const invoicesList = await Invoice.find().lean();
    const totalDiscountAmount = invoicesList.reduce((sum, inv) => sum + (inv.discountAmount || 0) + (inv.concessionAmount || 0), 0);

    // Fine collected
    const paidInvoices = await Invoice.find({ status: "Paid" }).lean();
    const fineCollection = paidInvoices.reduce((sum, inv) => sum + (inv.fineAmount || 0), 0);

    // Refund Amount
    const activeRefunds = await FeeRefund.find().lean();
    const refundAmount = activeRefunds.reduce((sum, r) => sum + r.amount, 0);

    // ─── Chart Data ──────────────────────────────────────────────────
    // 1. Monthly Collection Trend
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const mCollection = activeReceipts
        .filter(r => new Date(r.paymentDate) >= mStart && new Date(r.paymentDate) <= mEnd)
        .reduce((sum, r) => sum + r.amountPaid, 0);

      const monthName = d.toLocaleString("default", { month: "short" });
      monthlyTrend.push({ name: monthName, collected: mCollection });
    }

    // 2. Class-wise Collection vs Dues
    const classesList = await StudentFeeAssignment.find().distinct("className");
    const classWiseCollection = [];

    for (const clsName of classesList) {
      const clsInvoices = invoicesList.filter(inv => inv.feeStructureName && inv.feeStructureName.includes(clsName));
      const collected = clsInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const remaining = clsInvoices.reduce((sum, inv) => sum + (inv.payableAmount - inv.paidAmount), 0);
      classWiseCollection.push({ name: clsName, Collected: collected, Dues: remaining });
    }

    // 3. Category-wise Collection
    const categoriesList = await Student.find().distinct("category");
    const categoryWiseCollection = [];

    for (const catName of categoriesList) {
      const catStudents = await Student.find({ category: catName }).distinct("_id");
      const catInvoices = invoicesList.filter(inv => catStudents.some(sid => toIdStr(sid) === toIdStr(inv.student)));
      const collected = catInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      categoryWiseCollection.push({ name: catName || "General", value: collected });
    }

    return res.status(200).json({
      success: true,
      metrics: {
        totalCollection,
        monthlyCollection,
        dailyCollection,
        outstandingDues,
        totalDiscountAmount,
        fineCollection,
        refundAmount
      },
      charts: {
        monthlyTrend,
        classWiseCollection,
        categoryWiseCollection
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * FINANCE AUDIT LOGS
 */
export const getFinanceAuditLogs = async (req, res) => {
  try {
    const logs = await FinanceAuditLog.find()
      .populate("performedBy", "fullName email role")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
