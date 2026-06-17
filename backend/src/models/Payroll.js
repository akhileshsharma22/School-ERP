import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    basicPay: {
      type: Number,
      required: true,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    pf: {
      type: Number,
      default: 0,
    },
    esi: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Unpaid", "Paid"],
      default: "Unpaid",
    },
    paidAt: {
      type: Date,
    },
    payslipUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

payrollSchema.index({ staff: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema);
