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
        "ADMIN",
        "TEACHER",
        "PARENT",
      ],
      required: true,
    },

    assignedClasses: [
      {
        className: { type: String, required: true },
        sectionName: { type: String, required: true },
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
        subjectName: { type: String, required: true }
      }
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    refreshToken: String,

    photoUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);