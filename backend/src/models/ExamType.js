import mongoose from "mongoose";

const classAssignmentSchema = new mongoose.Schema(
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
  },
  {
    _id: true,
  }
);

const examTypeSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    examCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },

    weightage: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    applicableClasses: {
      type: [classAssignmentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

examTypeSchema.index(
  { examName: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

examTypeSchema.index(
  { examCode: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

export default mongoose.model("ExamType", examTypeSchema);
