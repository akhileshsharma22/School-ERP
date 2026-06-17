import mongoose from "mongoose";

const feeReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
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
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      required: true,
      enum: ["Cash", "UPI", "Card", "Cheque", "Bank Transfer"],
      default: "Cash",
    },
    transactionId: {
      type: String,
      trim: true,
      default: "",
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Success", "Bounced", "Refunded"],
      default: "Success",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

feeReceiptSchema.index({ student: 1 });
feeReceiptSchema.index({ invoice: 1 });

export default mongoose.model("FeeReceipt", feeReceiptSchema);
