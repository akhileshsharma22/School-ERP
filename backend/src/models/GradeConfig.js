import mongoose from "mongoose";

const gradeRangeSchema = new mongoose.Schema(
  {
    grade: { type: String, required: true, trim: true },
    minPercent: { type: Number, required: true, min: 0, max: 100 },
    maxPercent: { type: Number, required: true, min: 0, max: 100 },
    gradePoints: { type: Number, default: 0 },
    remark: { type: String, default: "" },
  },
  { _id: true }
);

const gradeConfigSchema = new mongoose.Schema(
  {
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
    },

    label: {
      type: String,
      default: "Default Grading",
      trim: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    grades: {
      type: [gradeRangeSchema],
      default: [
        { grade: "A1", minPercent: 91, maxPercent: 100, gradePoints: 10, remark: "Outstanding" },
        { grade: "A2", minPercent: 81, maxPercent: 90,  gradePoints: 9,  remark: "Excellent" },
        { grade: "B1", minPercent: 71, maxPercent: 80,  gradePoints: 8,  remark: "Very Good" },
        { grade: "B2", minPercent: 61, maxPercent: 70,  gradePoints: 7,  remark: "Good" },
        { grade: "C1", minPercent: 51, maxPercent: 60,  gradePoints: 6,  remark: "Average" },
        { grade: "C2", minPercent: 41, maxPercent: 50,  gradePoints: 5,  remark: "Satisfactory" },
        { grade: "D",  minPercent: 33, maxPercent: 40,  gradePoints: 4,  remark: "Below Average" },
        { grade: "F",  minPercent: 0,  maxPercent: 32,  gradePoints: 0,  remark: "Fail" },
      ],
    },
  },
  { timestamps: true }
);

gradeConfigSchema.index({ academicYear: 1 });
gradeConfigSchema.index({ isDefault: 1 });

export default mongoose.model("GradeConfig", gradeConfigSchema);
