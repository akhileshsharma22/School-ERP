import mongoose from "mongoose";

const feeStructureItemSchema = new mongoose.Schema(
  {
    feeCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeCategory",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const lateFineRuleSchema = new mongoose.Schema(
  {
    fineType: {
      type: String,
      required: true,
      enum: ["None", "Per Day", "Per Week", "Fixed", "Percentage"],
      default: "None",
    },
    fineAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    graceDays: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const feeStructureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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
    stream: {
      type: String,
      trim: true,
      default: "",
    },
    sectionName: {
      type: String,
      trim: true,
      default: "",
    },
    feeItems: {
      type: [feeStructureItemSchema],
      default: [],
    },
    installments: {
      type: String,
      required: true,
      enum: ["Annual", "Half-Yearly", "Quarterly", "Monthly", "Custom"],
      default: "Annual",
    },
    lateFineRule: {
      type: lateFineRuleSchema,
      required: true,
      default: () => ({ fineType: "None", fineAmount: 0, graceDays: 0 }),
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

feeStructureSchema.index(
  { academicYear: 1, className: 1, stream: 1, sectionName: 1 },
  { unique: true }
);

export default mongoose.model("FeeStructure", feeStructureSchema);
