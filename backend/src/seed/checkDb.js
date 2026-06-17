import mongoose from "mongoose";
import dotenv from "dotenv";
import AcademicYear from "../models/AcademicYear.js";
import ClassSection from "../models/ClassSection.js";
import Exam from "../models/Exam.js";
import ExamResultSummary from "../models/ExamResultSummary.js";
import Student from "../models/Student.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const years = await AcademicYear.find().lean();
    console.log("Academic Years in DB:", years);
    const classes = await ClassSection.find().lean();
    console.log("Classes in DB:", classes.map(c => ({ name: c.className, sections: c.sections.map(s => s.sectionName) })));
    const studentCount = await Student.countDocuments();
    console.log("Students count:", studentCount);
    const exams = await Exam.find().lean();
    console.log("Exams in DB:", exams.map(e => ({ name: e.examName, year: e.academicYearLabel })));
    const resultsCount = await ExamResultSummary.countDocuments();
    console.log("ExamResultSummary count:", resultsCount);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
