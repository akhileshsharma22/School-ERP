import mongoose from "mongoose";

const examAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "EXAM_CREATED",
        "EXAM_UPDATED",
        "EXAM_STATUS_CHANGED",
        "SCHEDULE_CREATED",
        "SCHEDULE_UPDATED",
        "SCHEDULE_DELETED",
        "MARKS_ENTERED",
        "MARKS_UPDATED",
        "MARKS_DELETED",
        "RESULT_COMPUTED",
        "RESULT_PUBLISHED",
        "BULK_RESULT_PUBLISHED",
        "REPORT_CARD_GENERATED",
        "GRADE_CONFIG_UPDATED",
      ],
    },

    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      default: null,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    details: {
      type: String,
      default: "",
    },

    ip: {
      type: String,
      default: "",
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

examAuditLogSchema.index({ exam: 1, createdAt: -1 });
examAuditLogSchema.index({ performedBy: 1 });
examAuditLogSchema.index({ action: 1 });

export default mongoose.model("ExamAuditLog", examAuditLogSchema);
