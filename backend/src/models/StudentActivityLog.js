import mongoose from "mongoose";

const studentActivityLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    action: {
      type: String,
      enum: [
        "Admission Approved",
        "Profile Updated",
        "Fee Assigned",
        "Attendance Updated",
        "Exam Result Generated",
        "Promotion Completed",
        "Document Uploaded",
        "Transfer Generated",
      ],
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    details: {
      type: String,
      default: "",
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

studentActivityLogSchema.index({ student: 1, timestamp: -1 });

export default mongoose.model("StudentActivityLog", studentActivityLogSchema);
