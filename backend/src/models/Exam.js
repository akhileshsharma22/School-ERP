import mongoose from "mongoose";

const applicableClassSchema = new mongoose.Schema(
  {
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
    sections: {
      type: [String],
      default: [],
    },
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
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

    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },

    academicYearLabel: {
      type: String,
      trim: true,
      default: "",
    },

    applicableClasses: {
      type: [applicableClassSchema],
      default: [],
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    resultDeclareDate: {
      type: Date,
    },

    passingPercentage: {
      type: Number,
      default: 33,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["Draft", "Scheduled", "Active", "Completed", "Published", "Cancelled"],
      default: "Draft",
    },

    instructions: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

examSchema.index({ examName: 1, academicYear: 1 }, { unique: true });
examSchema.index({ academicYear: 1 });
examSchema.index({ status: 1 });
examSchema.index({ examType: 1 });

export default mongoose.model("Exam", examSchema);
