import mongoose from "mongoose";

const assignedFeeItemSchema = new mongoose.Schema(
  {
    feeCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeCategory",
      required: true,
    },
    name: { type: String, required: true },
    baseAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const studentFeeAssignmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    feeStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeStructure",
      required: true,
    },
    className: { type: String, required: true },
    sectionName: { type: String, default: "" },
    category: { type: String, required: true },
    feeItems: [assignedFeeItemSchema],
    totalBaseAmount: { type: Number, required: true, min: 0 },
    totalDiscountAmount: { type: Number, required: true, min: 0, default: 0 },
    totalPayable: { type: Number, required: true, min: 0 },
    totalPaid: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid", "Refunded"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

studentFeeAssignmentSchema.index({ student: 1, academicYear: 1 }, { unique: true });

export default mongoose.model("StudentFeeAssignment", studentFeeAssignmentSchema);
