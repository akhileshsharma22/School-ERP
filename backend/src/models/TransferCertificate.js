import mongoose from "mongoose";

const transferCertificateSchema = new mongoose.Schema(
  {
    tcNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reason: {
      type: String,
      trim: true,
    },
    conduct: {
      type: String,
      trim: true,
      default: "Good",
    },
    academicSummary: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

transferCertificateSchema.index({ tcNumber: 1 });
transferCertificateSchema.index({ student: 1 });

export default mongoose.model("TransferCertificate", transferCertificateSchema);
