import mongoose from "mongoose";

const examScheduleSchema = new mongoose.Schema(
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

    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },

    examType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamType",
      required: true,
    },

    examTypeName: {
      type: String,
      trim: true,
      default: "",
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSection",
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

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    subjectName: {
      type: String,
      required: true,
      trim: true,
    },

    examDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    room: {
      type: String,
      trim: true,
      default: "",
    },

    invigilator: {
      type: String,
      trim: true,
      default: "",
    },

    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    passingMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Scheduled", "Ongoing", "Completed"],
      default: "Scheduled",
    },

    instructions: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Prevent duplicate schedules for same exam/class/section/subject
examScheduleSchema.index(
  { exam: 1, classId: 1, section: 1, subject: 1 },
  { unique: true }
);

examScheduleSchema.index({ exam: 1 });
examScheduleSchema.index({ classId: 1, section: 1, examDate: 1 });
examScheduleSchema.index({ room: 1, examDate: 1 });

export default mongoose.model("ExamSchedule", examScheduleSchema);
