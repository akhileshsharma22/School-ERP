import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
      default: "",
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: "",
    },
    nationality: {
      type: String,
      default: "Indian",
    },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed", "Other"],
      default: "Single",
    },
    photoUrl: {
      type: String,
      default: "",
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    alternateMobile: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },
    pincode: {
      type: String,
      required: true,
    },
    staffType: {
      type: String,
      required: true,
      enum: ["Teaching Staff", "Non Teaching Staff"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      required: true,
    },
    qualification: {
      type: String,
      trim: true,
      default: "",
    },
    experience: {
      type: String,
      trim: true,
      default: "",
    },
    dateOfJoining: {
      type: Date,
      required: true,
    },
    employmentType: {
      type: String,
      required: true,
      enum: ["Permanent", "Contract", "Probation", "Part Time", "Temporary"],
    },
    salary: {
      type: Number,
      required: true,
    },
    reportingManager: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "On Leave", "Resigned", "Terminated", "Retired"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

staffSchema.index({ employeeId: 1 });
staffSchema.index({ email: 1 });
staffSchema.index({ staffType: 1 });
staffSchema.index({ status: 1 });

export default mongoose.model("Staff", staffSchema);
