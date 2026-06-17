import mongoose from "mongoose";

const studentAttendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    class: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day", "Medical Leave", "Holiday"],
      required: true,
    },
    remarks: {
      type: String,
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

// Unique index so that there's at most one daily attendance log per student
studentAttendanceSchema.index({ student: 1, date: 1 }, { unique: true });
studentAttendanceSchema.index({ class: 1, section: 1, date: 1 });

export default mongoose.model("StudentAttendance", studentAttendanceSchema, "studentattendancelogs");
