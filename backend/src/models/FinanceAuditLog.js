import mongoose from "mongoose";

const financeAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "FEE_STRUCTURE_CREATED",
        "FEE_STRUCTURE_UPDATED",
        "FEE_STRUCTURE_DELETED",
        "FEE_ASSIGNED",
        "PAYMENT_COLLECTED",
        "DISCOUNT_APPLIED",
        "CONCESSION_APPLIED",
        "REFUND_ISSUED",
        "FEE_CATEGORY_CREATED",
        "FEE_CATEGORY_UPDATED",
        "FEE_CATEGORY_DELETED",
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("FinanceAuditLog", financeAuditLogSchema);
