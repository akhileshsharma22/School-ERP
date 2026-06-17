import mongoose from "mongoose";

const categoryDiscountSchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ["Percentage", "Fixed Amount", "Fee Head Specific", "Full Waiver"],
      default: "Percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    feeCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeCategory",
      default: null,
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
  { timestamps: true }
);

categoryDiscountSchema.index({ categoryName: 1, feeCategory: 1 }, { unique: true });

export default mongoose.model("CategoryDiscount", categoryDiscountSchema);
