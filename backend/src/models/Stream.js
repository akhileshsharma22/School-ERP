import mongoose from "mongoose";

const streamSchema = new mongoose.Schema(
  {
    streamName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    streamCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    applicableClasses: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: (classes) =>
          classes.length > 0 &&
          classes.every((className) =>
            ["Class 11", "Class 12"].includes(className)
          ),
        message:
          "Streams can only be assigned to Class 11 or Class 12",
      },
    },

    compulsorySubjects: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: (subjects) => subjects.length > 0,
        message:
          "At least one compulsory subject is required",
      },
    },

    optionalSubjects: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

streamSchema.index(
  { streamName: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

streamSchema.index(
  { streamCode: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

streamSchema.index({ status: 1 });
streamSchema.index({ applicableClasses: 1 });

export default mongoose.model("Stream", streamSchema);
