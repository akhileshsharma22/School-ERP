import mongoose from "mongoose";

const subjectResultSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    subjectName: { type: String, default: "" },
    maxMarks: { type: Number, default: 0 },
    marksObtained: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    grade: { type: String, default: "" },
    isPassed: { type: Boolean, default: false },
    isAbsent: { type: Boolean, default: false },
  },
  { _id: false }
);

const examResultSummarySchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    examName: {
      type: String,
      trim: true,
      default: "",
    },

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
      trim: true,
    },

    section: {
      type: String,
      required: true,
      trim: true,
    },

    totalMaxMarks: {
      type: Number,
      default: 0,
    },

    totalMarksObtained: {
      type: Number,
      default: 0,
    },

    percentage: {
      type: Number,
      default: 0,
    },

    grade: {
      type: String,
      default: "",
    },

    rank: {
      type: Number,
      default: 0,
    },

    division: {
      type: String,
      enum: ["First", "Second", "Third", "Pass", "Fail", ""],
      default: "",
    },

    resultStatus: {
      type: String,
      enum: ["PASS", "FAIL", "WITHHELD", "ABSENT"],
      default: "FAIL",
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    subjectResults: {
      type: [subjectResultSchema],
      default: [],
    },

    attendancePercentage: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

examResultSummarySchema.index(
  { exam: 1, student: 1 },
  { unique: true }
);

examResultSummarySchema.index({ exam: 1, className: 1, section: 1 });
examResultSummarySchema.index({ student: 1, academicYear: 1 });
examResultSummarySchema.index({ isPublished: 1 });

export default mongoose.model("ExamResultSummary", examResultSummarySchema);
