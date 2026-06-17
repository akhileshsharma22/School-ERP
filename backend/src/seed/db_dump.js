import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/Student.js";
import Admission from "../models/Admission.js";
import StudentFeeAssignment from "../models/StudentFeeAssignment.js";
import ExamResult from "../models/ExamResult.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("--- Student Count by Academic Year ---");
    const studentStats = await Student.aggregate([
      { $group: { _id: "$academicYear", count: { $sum: 1 } } }
    ]);
    console.log(studentStats);

    console.log("--- Admission Count by Academic Year ---");
    const admissionStats = await Admission.aggregate([
      { $group: { _id: "$academicYear", count: { $sum: 1 } } }
    ]);
    console.log(admissionStats);

    console.log("--- Fee Assignment Count by Academic Year ---");
    const feeStats = await StudentFeeAssignment.aggregate([
      { $group: { _id: "$academicYear", count: { $sum: 1 } } }
    ]);
    console.log(feeStats);

    console.log("--- ExamResult Count by Academic Year ---");
    const examStats = await ExamResult.aggregate([
      { $group: { _id: "$academicYear", count: { $sum: 1 } } }
    ]);
    console.log(examStats);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
