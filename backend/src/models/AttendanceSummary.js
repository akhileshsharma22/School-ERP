import mongoose from "mongoose";

const attendanceSummarySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    studentStats: {
      total: { type: Number, default: 0 },
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      late: { type: Number, default: 0 },
      percentage: { type: Number, default: 100 },
    },
    staffStats: {
      total: { type: Number, default: 0 },
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      onLeave: { type: Number, default: 0 },
      percentage: { type: Number, default: 100 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AttendanceSummary", attendanceSummarySchema);
