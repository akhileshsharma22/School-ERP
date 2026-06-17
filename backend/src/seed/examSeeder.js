import mongoose from "mongoose";
import dotenv from "dotenv";
import AcademicYear from "../models/AcademicYear.js";
import ClassSection from "../models/ClassSection.js";
import Subject from "../models/Subject.js";
import Student from "../models/Student.js";
import Admission from "../models/Admission.js";
import ExamType from "../models/ExamType.js";
import Exam from "../models/Exam.js";
import MarksEntry from "../models/MarksEntry.js";
import ExamResultSummary from "../models/ExamResultSummary.js";
import GradeConfig from "../models/GradeConfig.js";

dotenv.config();

const calculateGrade = (percent) => {
  if (percent >= 91) return "A1";
  if (percent >= 81) return "A2";
  if (percent >= 71) return "B1";
  if (percent >= 61) return "B2";
  if (percent >= 51) return "C1";
  if (percent >= 41) return "C2";
  if (percent >= 33) return "D";
  return "F";
};

const getDivision = (percent, isPassed) => {
  if (!isPassed) return "Fail";
  if (percent >= 60) return "First";
  if (percent >= 45) return "Second";
  if (percent >= 33) return "Third";
  return "Pass";
};

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/school-erp";
    console.log("Connecting to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected successfully. Cleaning collections...");

    // Clean data
    await Exam.deleteMany({});
    await ExamType.deleteMany({});
    await MarksEntry.deleteMany({});
    await ExamResultSummary.deleteMany({});
    await Student.deleteMany({});
    await Admission.deleteMany({});
    await AcademicYear.deleteMany({});
    await ClassSection.deleteMany({});
    await Subject.deleteMany({});
    await GradeConfig.deleteMany({});

    console.log("Creating Academic Year...");
    const ay = await AcademicYear.create({
      name: "2025-2026",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isCurrent: true,
      isActive: true,
    });

    console.log("Creating Classes and Sections...");
    const class10 = await ClassSection.create({
      className: "Class 10",
      displayOrder: 1,
      sections: [{ sectionName: "A", capacity: 40 }, { sectionName: "B", capacity: 40 }],
      status: "Active",
    });

    const class9 = await ClassSection.create({
      className: "Class 9",
      displayOrder: 2,
      sections: [{ sectionName: "A", capacity: 40 }],
      status: "Active",
    });

    console.log("Creating Subjects...");
    const subjectsList = [
      {
        subjectName: "Mathematics",
        subjectCode: "MATH101",
        subjectType: "Core",
        classAssignments: [
          { classId: class10._id, className: "Class 10", maxMarks: 100, passingMarks: 33 },
          { classId: class9._id, className: "Class 9", maxMarks: 100, passingMarks: 33 }
        ]
      },
      {
        subjectName: "Science",
        subjectCode: "SCI101",
        subjectType: "Core",
        classAssignments: [
          { classId: class10._id, className: "Class 10", maxMarks: 100, passingMarks: 33 },
          { classId: class9._id, className: "Class 9", maxMarks: 100, passingMarks: 33 }
        ]
      },
      {
        subjectName: "English",
        subjectCode: "ENG101",
        subjectType: "Core",
        classAssignments: [
          { classId: class10._id, className: "Class 10", maxMarks: 100, passingMarks: 33 },
          { classId: class9._id, className: "Class 9", maxMarks: 100, passingMarks: 33 }
        ]
      },
      {
        subjectName: "Social Science",
        subjectCode: "SST101",
        subjectType: "Core",
        classAssignments: [
          { classId: class10._id, className: "Class 10", maxMarks: 100, passingMarks: 33 }
        ]
      },
    ];
    const createdSubjects = await Subject.insertMany(subjectsList);

    console.log("Creating Grade Configuration...");
    await GradeConfig.create({
      academicYear: ay._id,
      label: "Standard CBSE Grading",
      isDefault: true,
      grades: [
        { grade: "A1", minPercent: 91, maxPercent: 100, gradePoints: 10, remark: "Outstanding" },
        { grade: "A2", minPercent: 81, maxPercent: 90,  gradePoints: 9,  remark: "Excellent" },
        { grade: "B1", minPercent: 71, maxPercent: 80,  gradePoints: 8,  remark: "Very Good" },
        { grade: "B2", minPercent: 61, maxPercent: 70,  gradePoints: 7,  remark: "Good" },
        { grade: "C1", minPercent: 51, maxPercent: 60,  gradePoints: 6,  remark: "Average" },
        { grade: "C2", minPercent: 41, maxPercent: 50,  gradePoints: 5,  remark: "Satisfactory" },
        { grade: "D",  minPercent: 33, maxPercent: 40,  gradePoints: 4,  remark: "Below Average" },
        { grade: "F",  minPercent: 0,  maxPercent: 32,  gradePoints: 0,  remark: "Fail" },
      ]
    });

    console.log("Creating Exam Types...");
    const etMidterm = await ExamType.create({
      examName: "Midterm Examination",
      examCode: "MIDTERM",
      weightage: 40,
      applicableClasses: [
        { classId: class10._id, className: "Class 10" },
        { classId: class9._id, className: "Class 9" }
      ]
    });

    const etFinal = await ExamType.create({
      examName: "Final Examination",
      examCode: "FINAL",
      weightage: 60,
      applicableClasses: [
        { classId: class10._id, className: "Class 10" }
      ]
    });

    console.log("Creating Students and Admissions...");
    const firstNames = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Ananya", "Diya", "Ishani", "Meera", "Riya", "Kabir", "Rohan", "Dev", "Rahul", "Neha", "Priya", "Karan", "Siddharth", "Aisha", "Saira"];
    const lastNames = ["Sharma", "Verma", "Gupta", "Patel", "Mehta", "Sen", "Joshi", "Rao", "Nair", "Iyer", "Choudhury", "Das", "Roy", "Singh", "Reddy", "Mishra", "Pandey", "Bose", "Kumar", "Shukla"];

    const students = [];
    for (let i = 0; i < 20; i++) {
      let className, sectionName;
      if (i < 12) {
        className = "Class 10";
        sectionName = i < 6 ? "A" : "B";
      } else {
        className = "Class 9";
        sectionName = "A";
      }

      const fName = firstNames[i];
      const lName = lastNames[i];
      const admissionNo = `ADM2025${1000 + i}`;
      const studentId = `STU2025${1000 + i}`;

      // Create Admission
      const admission = await Admission.create({
        academicYear: ay._id,
        admissionNo,
        studentId,
        firstName: fName,
        lastName: lName,
        dateOfBirth: new Date("2010-05-15"),
        gender: i % 2 === 0 ? "Male" : "Female",
        category: "General",
        classApplied: className,
        sectionApplied: sectionName,
        className,
        sectionName,
        fatherName: `${fName}'s Father`,
        fatherMobile: "9988776655",
        motherName: `${fName}'s Mother`,
        currentAddress: "123 Springfield Street",
        city: "Springfield",
        state: "Illinois",
        country: "United States",
        pinCode: "62701",
        status: "Approved",
      });

      // Create Student
      const student = await Student.create({
        studentId,
        admissionNo,
        admissionId: admission._id,
        academicYear: ay._id,
        firstName: fName,
        lastName: lName,
        dateOfBirth: new Date("2010-05-15"),
        gender: i % 2 === 0 ? "Male" : "Female",
        category: "General",
        className,
        sectionName,
        fatherName: `${fName}'s Father`,
        fatherMobile: "9988776655",
        motherName: `${fName}'s Mother`,
        currentAddress: "123 Springfield Street",
        status: "Active",
      });

      students.push(student);
    }
    console.log(`Successfully created ${students.length} students.`);

    console.log("Creating Exams...");
    const examJan = await Exam.create({
      examName: "Midterm Exams Jan 2026",
      examType: etMidterm._id,
      examTypeName: etMidterm.examName,
      academicYear: ay._id,
      academicYearLabel: ay.name,
      applicableClasses: [
        { classId: class10._id, className: "Class 10", sections: ["A", "B"] },
        { classId: class9._id, className: "Class 9", sections: ["A"] },
      ],
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-01-20"),
      resultDeclareDate: new Date("2026-01-30"),
      passingPercentage: 33,
      status: "Published",
    });

    const examMar = await Exam.create({
      examName: "Final Exams Mar 2026",
      examType: etFinal._id,
      examTypeName: etFinal.examName,
      academicYear: ay._id,
      academicYearLabel: ay.name,
      applicableClasses: [
        { classId: class10._id, className: "Class 10", sections: ["A", "B"] },
      ],
      startDate: new Date("2026-03-05"),
      endDate: new Date("2026-03-15"),
      resultDeclareDate: new Date("2026-03-25"),
      passingPercentage: 33,
      status: "Published",
    });

    const examsList = [examJan, examMar];

    console.log("Generating MarksEntry & ExamResultSummary records...");
    for (const exam of examsList) {
      // Find students in classes applicable to this exam
      const classNames = exam.applicableClasses.map(c => c.className);
      const examStudents = students.filter(s => classNames.includes(s.className));

      const examResults = [];

      for (const student of examStudents) {
        // Find subjects applicable to student's class
        const studentSubjects = createdSubjects.filter(sub =>
          sub.classAssignments.some(ca => ca.className === student.className)
        );

        let totalMax = 0;
        let totalObtained = 0;
        const subjectResults = [];

        for (const subject of studentSubjects) {
          const maxMarks = 100;
          // Generate realistic marks: some fail, mostly pass, some top performers
          let marksObtained = 40 + Math.floor(Math.random() * 56); // 40 to 95
          // Introduce a bit of variety (e.g. failure cases)
          if (student.firstName === "Vihaan" && subject.subjectName === "Mathematics") {
            marksObtained = 25; // fail case
          }
          if (student.firstName === "Aarav") {
            marksObtained = 92 + Math.floor(Math.random() * 8); // top achiever A1
          }

          const percentage = parseFloat(((marksObtained / maxMarks) * 100).toFixed(2));
          const grade = calculateGrade(percentage);
          const isPassed = percentage >= exam.passingPercentage;

          totalMax += maxMarks;
          totalObtained += marksObtained;

          await MarksEntry.create({
            exam: exam._id,
            student: student._id,
            subject: subject._id,
            subjectName: subject.subjectName,
            academicYear: ay._id,
            className: student.className,
            section: student.sectionName,
            maxMarks,
            passingMarks: 33,
            marksObtained,
            percentage,
            grade,
            isPassed,
            isAbsent: false,
            isDraft: false,
          });

          subjectResults.push({
            subject: subject._id,
            subjectName: subject.subjectName,
            maxMarks,
            marksObtained,
            percentage,
            grade,
            isPassed,
            isAbsent: false,
          });
        }

        const percentage = parseFloat(((totalObtained / totalMax) * 100).toFixed(2));
        const grade = calculateGrade(percentage);
        const allPassed = subjectResults.every(sr => sr.isPassed);
        const resultStatus = allPassed ? "PASS" : "FAIL";
        const division = getDivision(percentage, allPassed);

        examResults.push({
          exam: exam._id,
          examName: exam.examName,
          student: student._id,
          academicYear: ay._id,
          className: student.className,
          section: student.sectionName,
          totalMaxMarks: totalMax,
          totalMarksObtained: totalObtained,
          percentage,
          grade,
          division,
          resultStatus,
          isPublished: true,
          subjectResults,
          attendancePercentage: 85 + Math.floor(Math.random() * 15),
        });
      }

      // Calculate Rank for each class and section
      const uniqueClasses = [...new Set(examResults.map(r => r.className))];
      for (const clsName of uniqueClasses) {
        const classResults = examResults.filter(r => r.className === clsName);
        classResults.sort((a, b) => b.percentage - a.percentage);
        classResults.forEach((r, idx) => {
          r.rank = idx + 1;
        });
      }

      // Save ExamResultSummaries to DB
      for (const resData of examResults) {
        await ExamResultSummary.create(resData);
      }
    }

    console.log("Seeding Completed Successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed with error:", err);
    process.exit(1);
  }
};

seedData();
