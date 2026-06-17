import mongoose from "mongoose";

const departmentMappingSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    departmentName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: true,
  }
);

const designationSchema = new mongoose.Schema(
  {
    designationName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    designationCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },

    departments: {
      type: [departmentMappingSchema],
      required: true,
      validate: {
        validator: (departments) => departments.length > 0,
        message: "At least one department is required",
      },
    },
  },
  {
    timestamps: true,
  }
);

designationSchema.index(
  { designationName: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

designationSchema.index(
  { designationCode: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

export default mongoose.model("Designation", designationSchema);
