import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    admissionNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      required: true,
    },

    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
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

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    aadhaarNumber: {
      type: String,
      trim: true,
      default: "",
    },

    className: {
      type: String,
      required: true,
    },

    sectionName: {
      type: String,
      required: true,
    },

    stream: {
      type: String,
      default: "",
    },

    fatherName: {
      type: String,
      required: true,
    },

    fatherMobile: {
      type: String,
      required: true,
    },

    fatherEmail: {
      type: String,
      default: "",
    },

    motherName: {
      type: String,
      required: true,
    },

    motherMobile: {
      type: String,
      default: "",
    },

    currentAddress: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Transferred", "Passed Out", "Failed"],
      default: "Active",
    },

    photoUrl: {
      type: String,
      default: "",
    },

    transferHistory: [
      {
        transferDate: {
          type: Date,
          default: Date.now,
        },
        transferType: {
          type: String,
          enum: ["Internal Transfer (Section Change)", "Internal Transfer (Class Change)", "School Leaving Transfer"],
        },
        fromClass: String,
        fromSection: String,
        toClass: String,
        toSection: String,
        reason: String,
        remarks: String,
        processedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    promotionHistory: [
      {
        fromAcademicYear: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AcademicYear",
        },
        fromClass: String,
        fromSection: String,
        toAcademicYear: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AcademicYear",
        },
        toClass: String,
        toSection: String,
        finalPercentage: Number,
        resultStatus: String,
        promotedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        promotedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    healthRecord: {
      bloodGroup: { type: String, default: "" },
      medicalCondition: { type: String, default: "" },
      allergies: { type: String, default: "" },
      emergencyContact: { type: String, default: "" },
      doctorName: { type: String, default: "" },
      doctorContact: { type: String, default: "" },
      medicalHistory: { type: String, default: "" },
    },

    transportDetails: {
      route: { type: String, default: "" },
      vehicle: { type: String, default: "" },
      pickupPoint: { type: String, default: "" },
      driverName: { type: String, default: "" },
      driverContact: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.index({ className: 1 });
studentSchema.index({ academicYear: 1 });

export default mongoose.model("Student", studentSchema);
