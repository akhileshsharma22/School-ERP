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
  },
  {
    _id: true,
  }
);

const subjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    subjectCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },

    subjectType: {
      type: String,
      required: true,
      enum: ["Core", "Elective", "Language", "Practical", "Optional"],
    },

    classAssignments: {
      type: [classAssignmentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index(
  { subjectName: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

subjectSchema.index(
  { subjectCode: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

subjectSchema.index({ subjectType: 1 });

export default mongoose.model("Subject", subjectSchema);
