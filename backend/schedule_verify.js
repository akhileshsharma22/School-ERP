import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import AcademicYear from "./src/models/AcademicYear.js";
import ClassSection from "./src/models/ClassSection.js";
import Subject from "./src/models/Subject.js";
import ExamType from "./src/models/ExamType.js";
import Exam from "./src/models/Exam.js";
import User from "./src/models/User.js";
import ExamSchedule from "./src/models/ExamSchedule.js";

dotenv.config();

const API_BASE = "http://127.0.0.1:5000/api/exam-schedules";

const run = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // 1. Get Admin User
    const admin = await User.findOne({ role: { $in: ["SUPER_ADMIN", "ADMIN"] } }).lean();
    if (!admin) {
      console.error("No Admin/Super Admin user found in database. Please run seed:admin first.");
      process.exit(1);
    }
    console.log(`Using admin user: ${admin.email || admin.fullName} (${admin.role})`);

    // Sign JWT
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };

    // 2. Setup/Fetch required master data
    let academicYear = await AcademicYear.findOne({ name: "2025-2026" });
    if (!academicYear) {
      academicYear = await AcademicYear.create({
        name: "2025-2026",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2026-03-31"),
        isCurrent: true,
        isActive: true
      });
    }

    let classSection = await ClassSection.findOne({ className: "5" });
    if (!classSection) {
      classSection = await ClassSection.create({
        className: "5",
        sections: [{ sectionName: "A" }, { sectionName: "B" }]
      });
    }

    let examType = await ExamType.findOne();
    if (!examType) {
      examType = await ExamType.create({
        examName: "Half Yearly",
        examCode: "HY",
        weightage: 50
      });
    }

    let exam = await Exam.findOne({ examName: "Midterm Exams Jan 2026" });
    if (!exam) {
      exam = await Exam.create({
        examName: "Midterm Exams Jan 2026",
        examType: examType._id,
        examTypeName: examType.examName,
        academicYear: academicYear._id,
        academicYearLabel: academicYear.name,
        applicableClasses: [{ classId: classSection._id, className: "5", sections: ["A", "B"] }],
        startDate: new Date("2026-01-10"),
        endDate: new Date("2026-01-25"),
        resultDeclarationDate: new Date("2026-02-10"),
        passingPercentage: 33,
        status: "Active"
      });
    }

    let subject = await Subject.findOne({ subjectName: "Mathematics" });
    if (!subject) {
      subject = await Subject.create({
        subjectName: "Mathematics",
        subjectCode: "MATH05",
        subjectType: "Core",
        classAssignments: [{
          classId: classSection._id,
          className: "5",
          maxMarks: 100,
          passingMarks: 33
        }]
      });
    }

    // Ensure we clean up any pre-existing schedules for our test parameters to start clean
    await ExamSchedule.deleteMany({
      exam: exam._id,
      classId: classSection._id,
      section: "A"
    });

    console.log("Ready to test schedules creation...");

    const newSchedulePayload = {
      academicYear: academicYear._id,
      exam: exam._id,
      examType: examType._id,
      examTypeName: examType.examName,
      classId: classSection._id,
      className: classSection.className,
      section: "A",
      subject: subject._id,
      subjectName: subject.subjectName,
      examDate: "2026-01-15",
      startTime: "09:00",
      endTime: "12:00",
      room: "Room 101",
      invigilator: "John Doe",
      maxMarks: 100,
      passingMarks: 33,
      status: "Scheduled",
      instructions: "No electronic items allowed."
    };

    // 3. Test Schedule Entry Creation
    console.log("Test Case 1: Creating a valid schedule entry...");
    const createRes = await fetch(API_BASE, {
      method: "POST",
      headers,
      body: JSON.stringify(newSchedulePayload)
    });
    const createData = await createRes.json();
    console.log("Create Response Status:", createRes.status);
    console.log("Create Response Body:", createData);

    if (createRes.status !== 201 || !createData.success) {
      throw new Error(`Failed to create valid schedule: ${JSON.stringify(createData)}`);
    }

    const createdScheduleId = createData.entry._id;
    console.log("✓ Successfully created schedule entry with ID:", createdScheduleId);

    // 4. Test Conflict Cases (Same Date: 2026-01-15, Overlapping Time: 09:00-12:00)

    // Conflict 1: Same Class & Section (Class 5, Section A)
    // We try to schedule another subject (e.g. Science) for the same class/section at the same time.
    let scienceSubject = await Subject.findOne({ subjectName: "Science" });
    if (!scienceSubject) {
      scienceSubject = await Subject.create({
        subjectName: "Science",
        subjectCode: "SCI05",
        subjectType: "Core",
        classAssignments: [{
          classId: classSection._id,
          className: "5",
          maxMarks: 100,
          passingMarks: 33
        }]
      });
    }

    console.log("Test Case 2: Verification of Same Class + Section conflict block...");
    const conflict1Payload = {
      ...newSchedulePayload,
      subject: scienceSubject._id,
      subjectName: scienceSubject.subjectName,
      room: "Room 102", // change room so we only trigger class conflict
      invigilator: "Jane Smith" // change invigilator
    };
    const c1Res = await fetch(API_BASE, {
      method: "POST",
      headers,
      body: JSON.stringify(conflict1Payload)
    });
    const c1Data = await c1Res.json();
    console.log("C1 Response Status:", c1Res.status, "Message:", c1Data.message);
    if (c1Res.status !== 400 || c1Data.message !== "Schedule conflict detected.") {
      throw new Error("Failed Conflict 1: Same Class/Section overlap did not trigger expected status 400 with 'Schedule conflict detected.'");
    }
    console.log("✓ Conflict 1: Same Class/Section conflict correctly blocked!");

    // Conflict 2: Same Room (Room 101)
    // We try to schedule class 5 B in Room 101 at the same time
    console.log("Test Case 3: Verification of Same Room conflict block...");
    const conflict2Payload = {
      ...newSchedulePayload,
      section: "B", // different section
      subject: scienceSubject._id,
      subjectName: scienceSubject.subjectName,
      invigilator: "Jane Smith", // change invigilator
      room: "Room 101" // same room
    };
    const c2Res = await fetch(API_BASE, {
      method: "POST",
      headers,
      body: JSON.stringify(conflict2Payload)
    });
    const c2Data = await c2Res.json();
    console.log("C2 Response Status:", c2Res.status, "Message:", c2Data.message);
    if (c2Res.status !== 400 || c2Data.message !== "Schedule conflict detected.") {
      throw new Error("Failed Conflict 2: Same Room overlap did not trigger expected status 400 with 'Schedule conflict detected.'");
    }
    console.log("✓ Conflict 2: Same Room conflict correctly blocked!");

    // Conflict 3: Same Invigilator (John Doe)
    // We try to schedule class 5 B with John Doe in Room 102 at the same time
    console.log("Test Case 4: Verification of Same Invigilator conflict block...");
    const conflict3Payload = {
      ...newSchedulePayload,
      section: "B", // different section
      subject: scienceSubject._id,
      subjectName: scienceSubject.subjectName,
      room: "Room 102", // different room
      invigilator: "John Doe" // same invigilator
    };
    const c3Res = await fetch(API_BASE, {
      method: "POST",
      headers,
      body: JSON.stringify(conflict3Payload)
    });
    const c3Data = await c3Res.json();
    console.log("C3 Response Status:", c3Res.status, "Message:", c3Data.message);
    if (c3Res.status !== 400 || c3Data.message !== "Schedule conflict detected.") {
      throw new Error("Failed Conflict 3: Same Invigilator overlap did not trigger expected status 400 with 'Schedule conflict detected.'");
    }
    console.log("✓ Conflict 3: Same Invigilator conflict correctly blocked!");

    // Conflict 4: Same Subject (Mathematics)
    // We try to schedule Class 5 B for Mathematics in Room 102 with Jane Smith at the same time
    console.log("Test Case 5: Verification of Same Subject conflict block...");
    const conflict4Payload = {
      ...newSchedulePayload,
      section: "B", // different section
      subject: subject._id, // same subject (Mathematics)
      room: "Room 102", // different room
      invigilator: "Jane Smith" // different invigilator
    };
    const c4Res = await fetch(API_BASE, {
      method: "POST",
      headers,
      body: JSON.stringify(conflict4Payload)
    });
    const c4Data = await c4Res.json();
    console.log("C4 Response Status:", c4Res.status, "Message:", c4Data.message);
    if (c4Res.status !== 400 || c4Data.message !== "Schedule conflict detected.") {
      throw new Error("Failed Conflict 4: Same Subject overlap did not trigger expected status 400 with 'Schedule conflict detected.'");
    }
    console.log("✓ Conflict 4: Same Subject conflict correctly blocked!");

    // 5. Test Schedule Update (PUT)
    console.log("Test Case 6: Modifying the schedule entry...");
    const updatePayload = {
      ...newSchedulePayload,
      room: "Room 105", // change room
      passingMarks: 40 // change passing marks
    };
    const updateRes = await fetch(`${API_BASE}/${createdScheduleId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updatePayload)
    });
    const updateData = await updateRes.json();
    console.log("Update Response Status:", updateRes.status);
    console.log("Update Response Body:", updateData);

    if (updateRes.status !== 200 || !updateData.success || updateData.entry.room !== "Room 105" || updateData.entry.passingMarks !== 40) {
      throw new Error(`Failed to update schedule: ${JSON.stringify(updateData)}`);
    }
    console.log("✓ Successfully updated schedule entry!");

    // 6. Test Schedule Deletion (DELETE)
    console.log("Test Case 7: Deleting the schedule entry...");
    const deleteRes = await fetch(`${API_BASE}/${createdScheduleId}`, {
      method: "DELETE",
      headers
    });
    const deleteData = await deleteRes.json();
    console.log("Delete Response Status:", deleteRes.status);
    console.log("Delete Response Body:", deleteData);

    if (deleteRes.status !== 200 || !deleteData.success) {
      throw new Error(`Failed to delete schedule: ${JSON.stringify(deleteData)}`);
    }
    console.log("✓ Successfully deleted schedule entry!");

    console.log("\n=============================================");
    console.log("ALL AUTOMATED TESTS PASSED SUCCESSFULLY! (7/7)");
    console.log("=============================================");
    process.exit(0);
  } catch (error) {
    console.error("Verification Test Error:", error);
    process.exit(1);
  }
};

run();
