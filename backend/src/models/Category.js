import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    shortCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },

    categoryType: {
      type: String,
      required: true,
      enum: [
        "General",
        "OBC",
        "SC",
        "ST",
        "EWS",
        "Minority",
        "Management Quota",
        "Sports Quota",
        "Defence",
        "Physically Disabled",
        "Other",
      ],
    },

    description: {
      type: String,
      trim: true,
      default: "",
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

// Unique indexes for case-insensitive comparison (using collation)
categorySchema.index(
  { name: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

categorySchema.index(
  { shortCode: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

categorySchema.index({ status: 1 });

export default mongoose.model("Category", categorySchema);
