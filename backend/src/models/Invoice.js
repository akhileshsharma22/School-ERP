import mongoose from "mongoose";

const invoiceItemBreakdownSchema = new mongoose.Schema(
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

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    admission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Unpaid", "Paid", "Partially Paid"],
      default: "Unpaid",
    },

    feeStructureName: {
      type: String,
      required: true,
      trim: true,
    },

    // Extended Fees & Finance Integration Fields
    feeAssignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentFeeAssignment",
      default: null,
    },

    installmentName: {
      type: String,
      default: "",
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    fineAmount: {
      type: Number,
      default: 0,
    },

    concessionAmount: {
      type: Number,
      default: 0,
    },

    payableAmount: {
      type: Number,
      default: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    feeBreakdown: {
      type: [invoiceItemBreakdownSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ student: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ feeAssignment: 1 });

export default mongoose.model("Invoice", invoiceSchema);
