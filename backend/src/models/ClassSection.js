import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: true,
      trim: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    classTeacher: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: true,
  }
);

const classSectionSchema =
  new mongoose.Schema(
    {
      className: {
        type: String,
        required: true,
        trim: true,
      },

      displayOrder: {
        type: Number,
        required: true,
        min: 1,
      },

      status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
      },

      examTypes: {
        type: [String],
        required: true,
        default: [],
      },

      sections: {
        type: [sectionSchema],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

classSectionSchema.index(
  {
    className: 1,
  },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

classSectionSchema.index({
  displayOrder: 1,
});

export default mongoose.model(
  "ClassSection",
  classSectionSchema
);
