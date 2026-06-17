import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    leaveType: {
      type: String,
      required: true,
      enum: [
        "Casual Leave",
        "Sick Leave",
        "Earned Leave",
        "Maternity Leave",
        "Paternity Leave",
        "Unpaid Leave",
      ],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

leaveRequestSchema.index({ staff: 1 });
leaveRequestSchema.index({ status: 1 });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
