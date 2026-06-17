import mongoose from "mongoose";

const staffDocumentSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    docType: {
      type: String,
      required: true,
      enum: [
        "Photo",
        "Aadhaar",
        "PAN Card",
        "Resume",
        "Educational Certificates",
        "Experience Certificates",
        "Joining Letter",
        "Contract Letter",
        "Other Documents",
      ],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

staffDocumentSchema.index({ staff: 1 });

export default mongoose.model("StaffDocument", staffDocumentSchema);
