import mongoose from "mongoose";

const feeCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    frequency: {
      type: String,
      required: true,
      enum: ["One-Time", "Monthly", "Quarterly", "Half-Yearly", "Annually"],
      default: "Annually",
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("FeeCategory", feeCategorySchema);
