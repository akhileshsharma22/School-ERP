import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    motherName: {
      type: String,
      trim: true,
      default: "",
    },

    mobileNumber: {
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
      trim: true,
      lowercase: true,
      default: "",
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },

    interestedClass: {
      type: String,
      required: true,
      trim: true,
    },

    interestedStream: {
      type: String,
      trim: true,
      default: "",
    },

    currentSchool: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    leadSource: {
      type: String,
      enum: [
        "Website",
        "Walk-In",
        "Phone",
        "Referral",
        "Social Media",
        "Advertisement",
        "Other",
      ],
      default: "Walk-In",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    counselorAssigned: {
      type: String,
      trim: true,
      default: "",
    },

    followUpDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["New", "Interested", "Follow Up", "Converted", "Rejected"],
      default: "New",
    },

    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and duplicate checks
enquirySchema.index({ mobileNumber: 1 });
enquirySchema.index({ email: 1 });
enquirySchema.index({ studentName: 1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ academicYear: 1 });

export default mongoose.model("Enquiry", enquirySchema);
