import mongoose from "mongoose";

const staffActivityLogSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    details: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

staffActivityLogSchema.index({ staff: 1 });
staffActivityLogSchema.index({ createdAt: -1 });

export default mongoose.model("StaffActivityLog", staffActivityLogSchema);
