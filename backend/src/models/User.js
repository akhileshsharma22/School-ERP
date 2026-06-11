import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
    },

    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },

    admissionNo: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "ADMIN",
        "STAFF",
        "ACCOUNTANT",
        "PARENT",
      ],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    refreshToken: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);