import mongoose from "mongoose";

const staffAttendanceSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
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
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Present", "Absent", "Late", "Half Day", "Work From Home", "On Leave", "Holiday"],
    },
    checkIn: {
      type: String, // Biometric check-in e.g. "09:05 AM"
      default: "",
    },
    checkOut: {
      type: String, // Biometric check-out e.g. "05:00 PM"
      default: "",
    },
    workingHours: {
      type: Number, // calculated working hours e.g. 7.9
      default: 0,
    },
    lateArrival: {
      type: Boolean,
      default: false,
    },
    earlyDeparture: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

staffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ date: 1 });

export default mongoose.model("StaffAttendance", staffAttendanceSchema);
