import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "../models/User.js";
import AcademicYear from "../models/AcademicYear.js";
import ClassSection from "../models/ClassSection.js";
import Subject from "../models/Subject.js";
import Department from "../models/Department.js";
import Designation from "../models/Designation.js";
import Staff from "../models/Staff.js";
import Student from "../models/Student.js";
import Admission from "../models/Admission.js";

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Seeding...");

    // 1. Create Academic Year if not present
    let academicYear = await AcademicYear.findOne({ isCurrent: true });
    if (!academicYear) {
      academicYear = await AcademicYear.create({
        name: "2026-2027",
        startDate: new Date("2026-04-01"),
        endDate: new Date("2027-03-31"),
        isCurrent: true,
        status: "Active"
      });
      console.log("Seeded Academic Year:", academicYear.name);
    }

    // 2. Create Subject if not present
    let subject = await Subject.findOne({ subjectCode: "MATH101" });
    if (!subject) {
      subject = await Subject.create({
        subjectName: "Mathematics",
        subjectCode: "MATH101",
        subjectType: "Core",
        classAssignments: []
      });
      console.log("Seeded Subject:", subject.subjectName);
    }

    // 3. Create ClassSection if not present
    let classSection = await ClassSection.findOne({ className: "Class 10" });
    if (!classSection) {
      classSection = await ClassSection.create({
        className: "Class 10",
        displayOrder: 10,
        status: "Active",
        sections: [
          {
            sectionName: "A",
            capacity: 40,
            classTeacher: "Jane Doe"
          }
        ]
      });
      console.log("Seeded Class & Section: Class 10 - A");
    } else {
      // Ensure section A exists
      const sectionExists = classSection.sections.some(s => s.sectionName === "A");
      if (!sectionExists) {
        classSection.sections.push({
          sectionName: "A",
          capacity: 40,
          classTeacher: "Jane Doe"
        });
        await classSection.save();
      }
    }

    // Associate subject with class section
    const isSubjectAssigned = subject.classAssignments.some(c => c.className === "Class 10");
    if (!isSubjectAssigned) {
      subject.classAssignments.push({
        classId: classSection._id,
        className: "Class 10",
        maxMarks: 100,
        passingMarks: 33
      });
      await subject.save();
    }

    // 4. Create Department if not present
    let department = await Department.findOne({ departmentName: "Academics" });
    if (!department) {
      department = await Department.create({
        departmentName: "Academics",
        departmentCode: "ACAD",
        description: "Academic Department"
      });
      console.log("Seeded Department:", department.departmentName);
    }

    // 5. Create Designation if not present
    let designation = await Designation.findOne({ designationName: "Senior Teacher" });
    if (!designation) {
      designation = await Designation.create({
        designationName: "Senior Teacher",
        designationCode: "SRTCH",
        departments: [
          {
            departmentId: department._id,
            departmentName: department.departmentName
          }
        ]
      });
      console.log("Seeded Designation:", designation.designationName);
    }

    // 6. Clear existing seeded users
    await User.deleteMany({ email: { $in: ["admin@erp.com", "teacher@erp.com", "parent@erp.com"] } });
    await Staff.deleteMany({ email: "teacher@erp.com" });
    await Student.deleteMany({ fatherEmail: "parent@erp.com" });
    await Admission.deleteMany({ fatherEmail: "parent@erp.com" });

    const hashedAdminPassword = await bcrypt.hash("Admin@123", 12);
    const hashedTeacherPassword = await bcrypt.hash("Teacher@123", 12);
    const hashedParentPassword = await bcrypt.hash("Parent@123", 12);

    // 7. Seed Admin User
    const adminUser = await User.create({
      fullName: "System Admin",
      email: "admin@erp.com",
      password: hashedAdminPassword,
      role: "ADMIN",
      isActive: true
    });
    console.log("Seeded Admin User: admin@erp.com / Admin@123");

    // 8. Seed Teacher User & Staff Record
    const teacherUser = await User.create({
      fullName: "Jane Doe",
      email: "teacher@erp.com",
      password: hashedTeacherPassword,
      role: "TEACHER",
      employeeId: "EMP001",
      isActive: true,
      assignedClasses: [
        {
          className: "Class 10",
          sectionName: "A",
          subjectId: subject._id,
          subjectName: subject.subjectName
        }
      ]
    });
    console.log("Seeded Teacher User: teacher@erp.com / Teacher@123 (Class 10-A Maths)");

    await Staff.create({
      employeeId: "EMP001",
      firstName: "Jane",
      lastName: "Doe",
      gender: "Female",
      dateOfBirth: new Date("1985-05-15"),
      mobile: "9876543210",
      email: "teacher@erp.com",
      address: "Teacher Colony",
      city: "Springfield",
      state: "Illinois",
      pincode: "123456",
      staffType: "Teaching Staff",
      department: department._id,
      designation: designation._id,
      dateOfJoining: new Date("2020-08-15"),
      employmentType: "Permanent",
      salary: 50000,
      status: "Active"
    });
    console.log("Seeded Teacher Staff record linked to User");

    // 9. Seed Parent User & Linked Student Profile
    const parentUser = await User.create({
      fullName: "John Parent",
      email: "parent@erp.com",
      password: hashedParentPassword,
      role: "PARENT",
      isActive: true
    });
    console.log("Seeded Parent User: parent@erp.com / Parent@123");

    const admission = await Admission.create({
      academicYear: academicYear._id,
      admissionNo: "ADM001",
      studentId: "STD001",
      firstName: "Test",
      lastName: "Student",
      dateOfBirth: new Date("2012-08-20"),
      gender: "Male",
      category: "General",
      classApplied: "Class 10",
      sectionApplied: "A",
      fatherName: "John Parent",
      fatherMobile: "9998887776",
      fatherEmail: "parent@erp.com",
      motherName: "Mary Parent",
      currentAddress: "Parent Town",
      city: "Springfield",
      state: "Illinois",
      country: "United States",
      pinCode: "123456",
      verificationStatus: "Verified",
      approvalStatus: "Approved",
      approvedBy: adminUser._id,
      approvalDate: new Date()
    });

    const student = await Student.create({
      studentId: "STD001",
      admissionNo: "ADM001",
      admissionId: admission._id,
      academicYear: academicYear._id,
      firstName: "Test",
      lastName: "Student",
      dateOfBirth: new Date("2012-08-20"),
      gender: "Male",
      category: "General",
      className: "Class 10",
      sectionName: "A",
      fatherName: "John Parent",
      fatherMobile: "9998887776",
      fatherEmail: "parent@erp.com",
      motherName: "Mary Parent",
      currentAddress: "Parent Town",
      status: "Active"
    });
    console.log("Seeded Student linked to Parent: Test Student (ADM001, Class 10-A)");

    console.log("Database Seeding Completed Successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedDB();