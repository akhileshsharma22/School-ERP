import mongoose from "mongoose";

const examResultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },

    className: {
      type: String,
      required: true,
    },

    sectionName: {
      type: String,
      required: true,
    },

    finalPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    resultStatus: {
      type: String,
      enum: ["PASS", "FAIL"],
      required: true,
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

examResultSchema.index({ student: 1, academicYear: 1 }, { unique: true });
examResultSchema.index({ className: 1, sectionName: 1 });

export default mongoose.model("ExamResult", examResultSchema);
