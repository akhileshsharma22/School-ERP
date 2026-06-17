import mongoose from "mongoose";

const feeRefundSchema = new mongoose.Schema(
  {
    refundNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    receipt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeReceipt",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      required: true,
      enum: ["Cash", "UPI", "Card", "Bank Transfer"],
      default: "Cash",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    refundDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("FeeRefund", feeRefundSchema);
