import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  docType: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Verified", "Rejected"],
    default: "Pending",
  },
  remarks: {
    type: String,
    default: "",
  },
});

const admissionSchema = new mongoose.Schema(
  {
    admissionDate: {
      type: Date,
      default: Date.now,
    },

    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },

    admissionNo: {
      type: String,
      unique: true,
      sparse: true,
    },

    studentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Student Details
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
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    bloodGroup: {
      type: String,
      trim: true,
      default: "",
    },
    religion: {
      type: String,
      trim: true,
      default: "",
    },
    nationality: {
      type: String,
      default: "Indian",
    },
    aadhaarNumber: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    caste: {
      type: String,
      trim: true,
      default: "",
    },
    motherTongue: {
      type: String,
      trim: true,
      default: "",
    },

    // Academic Details
    classApplied: {
      type: String,
      required: true,
      trim: true,
    },
    sectionApplied: {
      type: String,
      required: true,
      trim: true,
    },
    streamApplied: {
      type: String,
      trim: true,
      default: "",
    },
    previousSchool: {
      type: String,
      trim: true,
      default: "",
    },
    previousBoard: {
      type: String,
      trim: true,
      default: "",
    },
    previousPercentage: {
      type: Number,
      default: null,
    },
    previousRollNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // Father Details
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
    fatherOccupation: {
      type: String,
      trim: true,
      default: "",
    },
    fatherQualification: {
      type: String,
      trim: true,
      default: "",
    },
    fatherMobile: {
      type: String,
      required: true,
      trim: true,
    },
    fatherEmail: {
      type: String,
      trim: true,
      default: "",
    },
    fatherAnnualIncome: {
      type: Number,
      default: null,
    },
    fatherAadhaarNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // Mother Details
    motherName: {
      type: String,
      required: true,
      trim: true,
    },
    motherOccupation: {
      type: String,
      trim: true,
      default: "",
    },
    motherQualification: {
      type: String,
      trim: true,
      default: "",
    },
    motherMobile: {
      type: String,
      trim: true,
      default: "",
    },
    motherEmail: {
      type: String,
      trim: true,
      default: "",
    },
    motherAnnualIncome: {
      type: Number,
      default: null,
    },
    motherAadhaarNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // Guardian Details
    guardianName: {
      type: String,
      trim: true,
      default: "",
    },
    guardianRelationship: {
      type: String,
      trim: true,
      default: "",
    },
    guardianMobile: {
      type: String,
      trim: true,
      default: "",
    },
    guardianAddress: {
      type: String,
      trim: true,
      default: "",
    },

    // Address Details
    currentAddress: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    pinCode: {
      type: String,
      required: true,
      trim: true,
    },
    permanentAddress: {
      type: String,
      trim: true,
      default: "",
    },

    // Medical Details
    medicalCondition: {
      type: String,
      trim: true,
      default: "",
    },
    allergies: {
      type: String,
      trim: true,
      default: "",
    },
    disability: {
      type: String,
      trim: true,
      default: "",
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: "",
    },
    doctorName: {
      type: String,
      trim: true,
      default: "",
    },
    doctorContact: {
      type: String,
      trim: true,
      default: "",
    },

    // Transport Details
    needTransport: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    pickupPoint: {
      type: String,
      trim: true,
      default: "",
    },
    route: {
      type: String,
      trim: true,
      default: "",
    },
    stop: {
      type: String,
      trim: true,
      default: "",
    },

    // Hostel Details
    needHostel: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    hostelName: {
      type: String,
      trim: true,
      default: "",
    },
    roomNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // Uploaded Documents
    documents: [documentSchema],

    // Verification details
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
    verificationRemarks: {
      type: String,
      default: "",
    },
    verifierName: {
      type: String,
      default: "",
    },
    verificationDate: {
      type: Date,
    },

    // Approval details
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalDate: {
      type: Date,
    },

    // Fee Integration Assignee
    feeStructure: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Partially Paid", ""],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
admissionSchema.index({ academicYear: 1 });
admissionSchema.index({ classApplied: 1 });
admissionSchema.index({ verificationStatus: 1 });
admissionSchema.index({ approvalStatus: 1 });
admissionSchema.index({ aadhaarNumber: 1 });
admissionSchema.index({ firstName: 1, lastName: 1 });

export default mongoose.model("Admission", admissionSchema);
