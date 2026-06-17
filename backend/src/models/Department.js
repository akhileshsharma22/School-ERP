import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    departmentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    departmentCode: {
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
  },
  {
    timestamps: true,
  }
);

departmentSchema.index(
  { departmentName: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

departmentSchema.index(
  { departmentCode: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

export default mongoose.model("Department", departmentSchema);
