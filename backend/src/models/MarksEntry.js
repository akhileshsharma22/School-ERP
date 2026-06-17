import mongoose from "mongoose";

const marksEntrySchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    subjectName: {
      type: String,
      trim: true,
      default: "",
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

    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    passingMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    grade: {
      type: String,
      default: "",
    },

    isPassed: {
      type: Boolean,
      default: false,
    },

    isAbsent: {
      type: Boolean,
      default: false,
    },

    remarks: {
      type: String,
      default: "",
    },

    isDraft: {
      type: Boolean,
      default: false,
    },

    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Prevent duplicate entries
marksEntrySchema.index(
  { exam: 1, student: 1, subject: 1 },
  { unique: true }
);

marksEntrySchema.index({ exam: 1, className: 1, section: 1 });
marksEntrySchema.index({ student: 1, academicYear: 1 });
marksEntrySchema.index({ exam: 1, subject: 1 });

export default mongoose.model("MarksEntry", marksEntrySchema);
