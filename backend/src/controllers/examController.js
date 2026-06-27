import mongoose from "mongoose";
import Exam from "../models/Exam.js";
import ExamSchedule from "../models/ExamSchedule.js";
import MarksEntry from "../models/MarksEntry.js";
import ExamResultSummary from "../models/ExamResultSummary.js";
import ExamResult from "../models/ExamResult.js";
import GradeConfig from "../models/GradeConfig.js";
import ExamAuditLog from "../models/ExamAuditLog.js";
import AcademicYear from "../models/AcademicYear.js";
import ClassSection from "../models/ClassSection.js";
import Subject from "../models/Subject.js";
import Student from "../models/Student.js";
import ExamType from "../models/ExamType.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const getClientIp = (req) =>
  req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";

const DEFAULT_GRADES = [
  { grade: "A1", minPercent: 91, maxPercent: 100, gradePoints: 10, remark: "Outstanding" },
  { grade: "A2", minPercent: 81, maxPercent: 90,  gradePoints: 9,  remark: "Excellent" },
  { grade: "B1", minPercent: 71, maxPercent: 80,  gradePoints: 8,  remark: "Very Good" },
  { grade: "B2", minPercent: 61, maxPercent: 70,  gradePoints: 7,  remark: "Good" },
  { grade: "C1", minPercent: 51, maxPercent: 60,  gradePoints: 6,  remark: "Average" },
  { grade: "C2", minPercent: 41, maxPercent: 50,  gradePoints: 5,  remark: "Satisfactory" },
  { grade: "D",  minPercent: 33, maxPercent: 40,  gradePoints: 4,  remark: "Below Average" },
  { grade: "F",  minPercent: 0,  maxPercent: 32,  gradePoints: 0,  remark: "Fail" },
];

const computeGrade = (percentage, grades) => {
  const sorted = [...grades].sort((a, b) => b.minPercent - a.minPercent);
  const pct = Math.round(percentage * 100) / 100;
  for (const g of sorted) {
    if (pct >= g.minPercent && pct <= g.maxPercent) return g.grade;
  }
  return "F";
};

const computeDivision = (percentage) => {
  if (percentage >= 60) return "First";
  if (percentage >= 45) return "Second";
  if (percentage >= 33) return "Third";
  return "Fail";
};

const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const timesOverlap = (s1, e1, s2, e2) => {
  const a = timeToMinutes(s1), b = timeToMinutes(e1);
  const c = timeToMinutes(s2), d = timeToMinutes(e2);
  return a < d && c < b;
};

const audit = async (action, examId, req, details = "", meta = {}) => {
  try {
    await ExamAuditLog.create({
      action,
      exam: examId || null,
      performedBy: req.user?._id || null,
      details,
      ip: getClientIp(req),
      meta,
    });
  } catch (_) { /* non-blocking */ }
};

const getGrades = async (academicYearId) => {
  let cfg = null;
  if (academicYearId) {
    cfg = await GradeConfig.findOne({ academicYear: academicYearId });
  }
  if (!cfg) cfg = await GradeConfig.findOne({ isDefault: true });
  return cfg ? cfg.grades : DEFAULT_GRADES;
};

// ─────────────────────────────────────────────
// SETUP CHECK
// ─────────────────────────────────────────────

export const setupCheck = async (req, res) => {
  try {
    const [ayCount, classCount, subjectCount, studentCount, examTypeCount] = await Promise.all([
      AcademicYear.countDocuments(),
      ClassSection.countDocuments(),
      Subject.countDocuments(),
      Student.countDocuments({ status: "Active" }),
      ExamType.countDocuments(),
    ]);

    const missing = [];
    if (!ayCount) missing.push({ key: "academicYear", label: "Academic Year", path: "/master-setup/academic-years" });
    if (!classCount) missing.push({ key: "classes", label: "Classes & Sections", path: "/master-setup/classes" });
    if (!subjectCount) missing.push({ key: "subjects", label: "Subjects", path: "/master-setup/subjects" });
    if (!studentCount) missing.push({ key: "students", label: "Students", path: "/students" });
    if (!examTypeCount) missing.push({ key: "examTypes", label: "Exam Types", path: "/master-setup/exam-types" });

    return res.json({
      success: true,
      ready: missing.length === 0,
      missing,
      counts: { ayCount, classCount, subjectCount, studentCount, examTypeCount },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// EXAM CRUD
// ─────────────────────────────────────────────

export const getExams = async (req, res) => {
  try {
    const { academicYear, status, examType, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (academicYear && mongoose.Types.ObjectId.isValid(academicYear))
      filter.academicYear = new mongoose.Types.ObjectId(academicYear);
    if (status && status !== "All") filter.status = status;
    if (examType && mongoose.Types.ObjectId.isValid(examType))
      filter.examType = new mongoose.Types.ObjectId(examType);
    if (search) filter.examName = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [exams, total] = await Promise.all([
      Exam.find(filter)
        .populate("examType", "examName examCode weightage")
        .populate("academicYear", "year label")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Exam.countDocuments(filter),
    ]);

    return res.json({ success: true, exams, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid exam id" });

    const exam = await Exam.findById(id)
      .populate("examType", "examName examCode weightage")
      .populate("academicYear", "year label")
      .lean();

    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });
    return res.json({ success: true, exam });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createExam = async (req, res) => {
  try {
    const { examName, examType, academicYear, applicableClasses, startDate, endDate,
            resultDeclareDate, passingPercentage, instructions } = req.body;

    // Check required fields
    if (
      !examName?.trim() ||
      !examType ||
      !academicYear ||
      !startDate ||
      !endDate ||
      !resultDeclareDate ||
      passingPercentage === undefined ||
      passingPercentage === null ||
      passingPercentage === "" ||
      !applicableClasses ||
      applicableClasses.length === 0
    ) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    // Validate applicableClasses structure
    if (!Array.isArray(applicableClasses)) {
      return res.status(400).json({ success: false, message: "applicableClasses must be an array of class assignments" });
    }
    for (const ac of applicableClasses) {
      if (!ac || typeof ac !== "object" || !ac.classId || !mongoose.Types.ObjectId.isValid(ac.classId) || !ac.className?.trim()) {
        return res.status(400).json({ success: false, message: "Valid classId and className are required for each class assignment" });
      }
    }

    // Passing percentage range validation
    const pct = Number(passingPercentage);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    // Date range validation
    if (new Date(startDate) > new Date(endDate) || new Date(resultDeclareDate) < new Date(endDate)) {
      return res.status(400).json({ success: false, message: "Invalid date range" });
    }

    // Case-insensitive duplicate pre-check
    const existing = await Exam.findOne({
      examName: examName.trim(),
      academicYear
    }).collation({ locale: "en", strength: 2 });

    if (existing) {
      return res.status(400).json({ success: false, message: "Examination already exists" });
    }

    // Fetch denormalized labels
    const [et, ay] = await Promise.all([
      ExamType.findById(examType).select("examName").lean(),
      AcademicYear.findById(academicYear).select("year label").lean(),
    ]);

    const exam = await Exam.create({
      examName: examName.trim(),
      examType,
      examTypeName: et?.examName || "",
      academicYear,
      academicYearLabel: ay?.label || ay?.year || "",
      applicableClasses: applicableClasses || [],
      startDate,
      endDate,
      resultDeclareDate: resultDeclareDate || null,
      passingPercentage: pct,
      instructions: instructions || "",
      status: "Draft",
      createdBy: req.user?._id,
    });

    await audit("EXAM_CREATED", exam._id, req, `Created exam: ${exam.examName}`);
    return res.status(201).json({ success: true, message: "Exam created successfully", exam });
  } catch (err) {
    if (err?.code === 11000)
      return res.status(400).json({ success: false, message: "Examination already exists" });
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid exam id" });

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    if (["Completed", "Published"].includes(exam.status))
      return res.status(400).json({ success: false, message: "Cannot edit a completed or published exam" });

    const { examName, examType, academicYear, applicableClasses, startDate, endDate,
            resultDeclareDate, passingPercentage, instructions, status } = req.body;

    const newExamName = examName !== undefined ? examName.trim() : exam.examName;
    const newExamType = examType !== undefined ? examType : exam.examType;
    const newAcademicYear = academicYear !== undefined ? academicYear : exam.academicYear;
    const newApplicableClasses = applicableClasses !== undefined ? applicableClasses : exam.applicableClasses;
    const newStartDate = startDate !== undefined ? startDate : exam.startDate;
    const newEndDate = endDate !== undefined ? endDate : exam.endDate;
    const newResultDeclareDate = resultDeclareDate !== undefined ? resultDeclareDate : exam.resultDeclareDate;
    const newPassingPercentage = passingPercentage !== undefined ? passingPercentage : exam.passingPercentage;

    // Check required fields
    if (
      !newExamName ||
      !newExamType ||
      !newAcademicYear ||
      !newStartDate ||
      !newEndDate ||
      !newResultDeclareDate ||
      newPassingPercentage === undefined ||
      newPassingPercentage === null ||
      newPassingPercentage === "" ||
      !newApplicableClasses ||
      newApplicableClasses.length === 0
    ) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    // Validate newApplicableClasses structure
    if (!Array.isArray(newApplicableClasses)) {
      return res.status(400).json({ success: false, message: "applicableClasses must be an array of class assignments" });
    }
    for (const ac of newApplicableClasses) {
      if (!ac || typeof ac !== "object" || !ac.classId || !mongoose.Types.ObjectId.isValid(ac.classId) || !ac.className?.trim()) {
        return res.status(400).json({ success: false, message: "Valid classId and className are required for each class assignment" });
      }
    }

    // Passing percentage range validation
    const pct = Number(newPassingPercentage);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    // Date range validation
    if (new Date(newStartDate) > new Date(newEndDate) || new Date(newResultDeclareDate) < new Date(newEndDate)) {
      return res.status(400).json({ success: false, message: "Invalid date range" });
    }

    // Case-insensitive duplicate pre-check
    const existing = await Exam.findOne({
      examName: newExamName,
      academicYear: newAcademicYear,
      _id: { $ne: id }
    }).collation({ locale: "en", strength: 2 });

    if (existing) {
      return res.status(400).json({ success: false, message: "Examination already exists" });
    }

    // If status transition is requested, validate it
    if (status !== undefined && status !== exam.status) {
      const allowed = ["Draft", "Scheduled", "Active", "Completed", "Published", "Cancelled"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status value" });
      }
      const allowedTransitions = {
        Draft: ["Scheduled", "Cancelled"],
        Scheduled: ["Active", "Cancelled"],
        Active: ["Completed", "Cancelled"],
        Completed: ["Published"],
        Published: [],
        Cancelled: ["Draft"],
      };
      const allowedNext = allowedTransitions[exam.status] || [];
      if (!allowedNext.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${exam.status} to ${status}`
        });
      }
      exam.status = status;
    }

    exam.examName = newExamName;
    exam.applicableClasses = newApplicableClasses;
    exam.startDate = newStartDate;
    exam.endDate = newEndDate;
    exam.resultDeclareDate = newResultDeclareDate;
    exam.passingPercentage = pct;
    if (instructions !== undefined) exam.instructions = instructions;

    if (examType !== undefined) {
      const et = await ExamType.findById(examType).select("examName").lean();
      exam.examType = examType;
      exam.examTypeName = et?.examName || "";
    }

    if (academicYear !== undefined) {
      const ay = await AcademicYear.findById(academicYear).select("year label").lean();
      exam.academicYear = academicYear;
      exam.academicYearLabel = ay?.label || ay?.year || "";
    }

    await exam.save();
    await audit("EXAM_UPDATED", exam._id, req, `Updated exam: ${exam.examName}`);
    return res.json({ success: true, message: "Exam updated successfully", exam });
  } catch (err) {
    if (err?.code === 11000)
      return res.status(400).json({ success: false, message: "Examination already exists" });
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateExamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid exam id" });

    const allowed = ["Draft", "Scheduled", "Active", "Completed", "Published", "Cancelled"];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: "Invalid status value" });

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    const prev = exam.status;
    if (prev !== status) {
      const allowedTransitions = {
        Draft: ["Scheduled", "Cancelled"],
        Scheduled: ["Active", "Cancelled"],
        Active: ["Completed", "Cancelled"],
        Completed: ["Published"],
        Published: [],
        Cancelled: ["Draft"],
      };
      const allowedNext = allowedTransitions[prev] || [];
      if (!allowedNext.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${prev} to ${status}`
        });
      }
      exam.status = status;
      await exam.save();
    }

    await audit("EXAM_STATUS_CHANGED", exam._id, req, `Status: ${prev} → ${status}`);
    return res.json({ success: true, message: `Exam status updated to ${status}`, exam });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid exam id" });

    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

    // Enforce dependency check: schedules, marks, results, or result summaries
    const [hasSchedule, hasMarks, hasResults, hasResultSummaries] = await Promise.all([
      ExamSchedule.exists({ exam: id }),
      MarksEntry.exists({ exam: id }),
      ExamResult.exists({ exam: id }),
      ExamResultSummary.exists({ exam: id }),
    ]);

    if (hasSchedule || hasMarks || hasResults || hasResultSummaries) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete examination because records already exist."
      });
    }

    await Exam.deleteOne({ _id: id });
    await audit("EXAM_DELETED", id, req, `Deleted exam: ${exam.examName}`);

    return res.json({ success: true, message: "Exam deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// EXAM SCHEDULE
// ─────────────────────────────────────────────

export const getSchedule = async (req, res) => {
  try {
    const { examId, classId, section } = req.query;
    const filter = {};
    if (examId && mongoose.Types.ObjectId.isValid(examId)) filter.exam = examId;
    if (classId && mongoose.Types.ObjectId.isValid(classId)) filter.classId = classId;
    if (section) filter.section = section;

    if (req.user.role === "PARENT") {
      const parentStudents = await Student.find({
        $or: [
          { fatherEmail: req.user.email },
          { motherEmail: req.user.email }
        ]
      }).select("className sectionName");
      
      if (parentStudents.length > 0) {
        filter.$or = parentStudents.map(s => ({ className: s.className, section: s.sectionName }));
      } else {
        return res.json({ success: true, schedules: [] });
      }
    } else if (req.user.role === "TEACHER") {
      const assigned = req.user.assignedClasses || [];
      if (assigned.length > 0) {
        filter.$or = assigned.map(ac => ({ className: ac.className, section: ac.sectionName }));
      } else {
        return res.json({ success: true, schedules: [] });
      }
    }

    const schedules = await ExamSchedule.find(filter)
      .populate("subject", "subjectName subjectCode subjectType")
      .sort({ examDate: 1, startTime: 1 })
      .lean();

    return res.json({ success: true, schedules });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createScheduleEntry = async (req, res) => {
  try {
    const { exam, classId, className, section, subject, subjectName,
            examDate, startTime, endTime, room, invigilator, instructions } = req.body;

    if (!exam || !classId || !section || !subject || !examDate || !startTime || !endTime)
      return res.status(400).json({ success: false, message: "All required fields must be filled" });

    // Conflict detection — same room + date + overlapping time
    if (room) {
      const dateStr = new Date(examDate).toDateString();
      const roomConflicts = await ExamSchedule.find({
        room: { $regex: new RegExp(`^${room}$`, "i") },
        examDate: {
          $gte: new Date(new Date(examDate).setHours(0, 0, 0)),
          $lt: new Date(new Date(examDate).setHours(23, 59, 59)),
        },
      }).lean();
      for (const r of roomConflicts) {
        if (timesOverlap(startTime, endTime, r.startTime, r.endTime)) {
          return res.status(400).json({
            success: false,
            message: `Room conflict: ${room} is already booked from ${r.startTime}–${r.endTime} on this date`,
          });
        }
      }
    }

    // Conflict detection — same class/section/date overlapping time
    const classConflicts = await ExamSchedule.find({
      classId,
      section,
      examDate: {
        $gte: new Date(new Date(examDate).setHours(0, 0, 0)),
        $lt: new Date(new Date(examDate).setHours(23, 59, 59)),
      },
      subject: { $ne: subject },
    }).lean();

    for (const c of classConflicts) {
      if (timesOverlap(startTime, endTime, c.startTime, c.endTime)) {
        return res.status(400).json({
          success: false,
          message: `Time conflict: ${className} ${section} already has ${c.subjectName} at ${c.startTime}–${c.endTime}`,
        });
      }
    }

    const examDoc = await Exam.findById(exam).select("examName").lean();
    const entry = await ExamSchedule.create({
      exam, examName: examDoc?.examName || "",
      classId, className, section,
      subject, subjectName, examDate, startTime, endTime,
      room: room || "", invigilator: invigilator || "",
      instructions: instructions || "",
    });

    await audit("SCHEDULE_CREATED", exam, req, `Schedule: ${subjectName} for ${className} ${section}`);
    return res.status(201).json({ success: true, message: "Schedule entry created", entry });
  } catch (err) {
    if (err?.code === 11000)
      return res.status(400).json({ success: false, message: "Schedule already exists for this subject in this exam/class/section" });
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const bulkGenerateSchedule = async (req, res) => {
  try {
    const { exam, classId, className, section, startDate, startTime, endTime, room, entries } = req.body;
    // entries = [{ subjectId, subjectName, examDate }]
    if (!exam || !classId || !section || !Array.isArray(entries) || !entries.length)
      return res.status(400).json({ success: false, message: "Exam, class, section and schedule entries are required" });

    const examDoc = await Exam.findById(exam).select("examName").lean();
    const toInsert = entries.map((e) => ({
      exam, examName: examDoc?.examName || "",
      classId, className, section,
      subject: e.subjectId, subjectName: e.subjectName,
      examDate: e.examDate, startTime, endTime,
      room: room || "", invigilator: "",
    }));

    const ops = toInsert.map((doc) => ({
      updateOne: {
        filter: { exam: doc.exam, classId: doc.classId, section: doc.section, subject: doc.subject },
        update: { $setOnInsert: doc },
        upsert: true,
      },
    }));

    const result = await ExamSchedule.bulkWrite(ops, { ordered: false });
    await audit("SCHEDULE_UPDATED", exam, req, `Bulk schedule: ${result.upsertedCount} created`);
    return res.json({ success: true, message: `${result.upsertedCount} schedule entries created`, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateScheduleEntry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid schedule entry id" });

    const entry = await ExamSchedule.findById(id);
    if (!entry) return res.status(404).json({ success: false, message: "Schedule entry not found" });

    const fields = ["examDate", "startTime", "endTime", "room", "invigilator", "instructions"];
    fields.forEach((f) => { if (req.body[f] !== undefined) entry[f] = req.body[f]; });
    await entry.save();

    await audit("SCHEDULE_UPDATED", entry.exam, req, `Updated schedule: ${entry.subjectName}`);
    return res.json({ success: true, message: "Schedule entry updated", entry });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteScheduleEntry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid schedule entry id" });

    const entry = await ExamSchedule.findById(id);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    await ExamSchedule.deleteOne({ _id: id });
    await audit("SCHEDULE_DELETED", entry.exam, req, `Deleted: ${entry.subjectName}`);
    return res.json({ success: true, message: "Schedule entry deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// MARKS ENTRY
// ─────────────────────────────────────────────

export const getStudentsForMarks = async (req, res) => {
  try {
    const { className, section, academicYear } = req.query;
    if (!className) return res.status(400).json({ success: false, message: "Class is required" });

    if (req.user.role === "TEACHER") {
      const isAssigned = req.user.assignedClasses?.some(
        (ac) => ac.className === className && ac.sectionName === section
      );
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: "You are not assigned to this class and section." });
      }
    }

    const filter = { className, status: "Active" };
    if (section) filter.sectionName = section;
    if (academicYear && mongoose.Types.ObjectId.isValid(academicYear))
      filter.academicYear = new mongoose.Types.ObjectId(academicYear);

    const students = await Student.find(filter)
      .select("studentId admissionNo firstName middleName lastName gender photoUrl sectionName")
      .sort({ firstName: 1 })
      .lean();

    return res.json({ success: true, students });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getMarks = async (req, res) => {
  try {
    const { exam, className, section, subject } = req.query;
    const filter = {};
    if (exam && mongoose.Types.ObjectId.isValid(exam)) filter.exam = exam;
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (subject && mongoose.Types.ObjectId.isValid(subject)) filter.subject = subject;

    if (req.user.role === "PARENT") {
      const parentStudents = await Student.find({
        $or: [
          { fatherEmail: req.user.email },
          { motherEmail: req.user.email }
        ]
      }).distinct("_id");
      filter.student = { $in: parentStudents };
    } else if (req.user.role === "TEACHER") {
      const assigned = req.user.assignedClasses || [];
      if (assigned.length > 0) {
        filter.$or = assigned.map(ac => ({ className: ac.className, section: ac.sectionName, subject: ac.subjectId }));
      } else {
        return res.json({ success: true, marks: [] });
      }
    }

    const marks = await MarksEntry.find(filter)
      .populate("student", "studentId admissionNo firstName middleName lastName photoUrl")
      .populate("subject", "subjectName subjectCode")
      .lean();

    return res.json({ success: true, marks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const saveBulkMarks = async (req, res) => {
  try {
    const { exam, subject, academicYear, className, section, marksData, isDraft } = req.body;
    // marksData = [{ studentId, maxMarks, marksObtained, isAbsent, remarks }]

    if (!exam || !subject || !academicYear || !className || !section)
      return res.status(400).json({ success: false, message: "Exam, subject, academic year, class and section are required" });

    if (req.user.role === "TEACHER") {
      const isAssigned = req.user.assignedClasses?.some(
        (ac) => ac.className === className && ac.sectionName === section && ac.subjectId.toString() === subject.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({ success: false, message: "You are not authorized to save marks for this class, section, and subject." });
      }
    }

    if (!Array.isArray(marksData) || !marksData.length)
      return res.status(400).json({ success: false, message: "Marks data is required" });

    // Validate marks
    for (const m of marksData) {
      if (!m.isAbsent) {
        if (m.marksObtained === null || m.marksObtained === undefined || m.marksObtained === "")
          return res.status(400).json({ success: false, message: `Marks cannot be blank for student ${m.studentId}` });
        if (Number(m.marksObtained) < 0)
          return res.status(400).json({ success: false, message: "Negative marks are not allowed" });
        if (Number(m.marksObtained) > Number(m.maxMarks))
          return res.status(400).json({ success: false, message: `Marks obtained (${m.marksObtained}) cannot exceed maximum marks (${m.maxMarks})` });
      }
    }

    const grades = await getGrades(academicYear);
    const examDoc = await Exam.findById(exam).select("passingPercentage").lean();
    const passingPct = examDoc?.passingPercentage || 33;

    // Fetch subject passing marks config
    const subjectDoc = await Subject.findById(subject).select("classAssignments subjectName").lean();
    const classAssign = subjectDoc?.classAssignments?.find((c) => c.className === className);

    const ops = marksData.map((m) => {
      const maxMarks = Number(m.maxMarks) || (classAssign?.maxMarks || 100);
      const passingMarks = classAssign?.passingMarks || Math.ceil(maxMarks * passingPct / 100);
      const isAbsent = !!m.isAbsent;
      const obtained = isAbsent ? 0 : Number(m.marksObtained);
      const pct = maxMarks > 0 ? parseFloat(((obtained / maxMarks) * 100).toFixed(2)) : 0;
      const grade = isAbsent ? "AB" : computeGrade(pct, grades);
      const isPassed = !isAbsent && obtained >= passingMarks;

      return {
        updateOne: {
          filter: { exam, student: m.studentId, subject },
          update: {
            $set: {
              exam, student: m.studentId, subject,
              subjectName: subjectDoc?.subjectName || "",
              academicYear, className, section,
              maxMarks, passingMarks,
              marksObtained: obtained,
              percentage: pct, grade, isPassed, isAbsent,
              remarks: m.remarks || "",
              isDraft: !!isDraft,
              enteredBy: req.user?._id,
            },
          },
          upsert: true,
        },
      };
    });

    await MarksEntry.bulkWrite(ops, { ordered: false });
    await audit("MARKS_ENTERED", exam, req, `Marks saved for ${className} ${section} - ${subjectDoc?.subjectName}`);

    return res.json({ success: true, message: isDraft ? "Marks draft saved" : "Marks saved successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const clearMarks = async (req, res) => {
  try {
    const { exam, className, section, subject } = req.query;
    const filter = {};
    if (exam) filter.exam = exam;
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (subject) filter.subject = subject;

    await MarksEntry.deleteMany(filter);
    await audit("MARKS_DELETED", exam, req, `Cleared marks: ${className} ${section}`);
    return res.json({ success: true, message: "Marks cleared successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────

export const getResultsSummary = async (req, res) => {
  try {
    const { exam, className, section, academicYear } = req.query;
    const filter = {};
    if (exam && mongoose.Types.ObjectId.isValid(exam)) filter.exam = exam;
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (academicYear && mongoose.Types.ObjectId.isValid(academicYear)) filter.academicYear = academicYear;

    const results = await ExamResultSummary.find(filter).lean();

    const total = results.length;
    const passed = results.filter((r) => r.resultStatus === "PASS").length;
    const failed = results.filter((r) => r.resultStatus === "FAIL").length;
    const published = results.filter((r) => r.isPublished).length;
    const passPercent = total > 0 ? parseFloat(((passed / total) * 100).toFixed(2)) : 0;
    const classAvg = total > 0
      ? parseFloat((results.reduce((s, r) => s + r.percentage, 0) / total).toFixed(2)) : 0;

    let topper = null;
    if (results.length) {
      const top = results.reduce((a, b) => a.percentage > b.percentage ? a : b, results[0]);
      const topStudent = await Student.findById(top.student).select("firstName lastName admissionNo").lean();
      topper = { ...top, studentName: topStudent ? `${topStudent.firstName} ${topStudent.lastName}` : "—" };
    }

    const highest = results.length ? Math.max(...results.map((r) => r.percentage)) : 0;
    const lowest = results.length ? Math.min(...results.map((r) => r.percentage)) : 0;

    return res.json({
      success: true,
      summary: { total, passed, failed, published, passPercent, classAvg, highest, lowest, topper },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getResults = async (req, res) => {
  try {
    const { exam, className, section, academicYear, search, isPublished, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (exam && mongoose.Types.ObjectId.isValid(exam)) filter.exam = exam;
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (academicYear && mongoose.Types.ObjectId.isValid(academicYear)) filter.academicYear = academicYear;
    if (isPublished !== undefined) filter.isPublished = isPublished === "true";

    if (req.user.role === "PARENT") {
      const parentStudents = await Student.find({
        $or: [
          { fatherEmail: req.user.email },
          { motherEmail: req.user.email }
        ]
      }).distinct("_id");
      filter.student = { $in: parentStudents };
      filter.isPublished = true;
    } else if (req.user.role === "TEACHER") {
      const assigned = req.user.assignedClasses || [];
      if (assigned.length > 0) {
        filter.$or = assigned.map(ac => ({ className: ac.className, section: ac.sectionName }));
      } else {
        return res.json({ success: true, results: [], total: 0 });
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    let query = ExamResultSummary.find(filter)
      .populate("student", "studentId admissionNo firstName middleName lastName photoUrl")
      .populate("exam", "examName passingPercentage")
      .sort({ rank: 1, percentage: -1 });

    if (search) {
      const studentIds = await Student.find({
        $or: [
          { admissionNo: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ],
      }).distinct("_id");
      filter.student = { $in: studentIds };
    }

    const [results, total] = await Promise.all([
      ExamResultSummary.find(filter)
        .populate("student", "studentId admissionNo firstName middleName lastName photoUrl")
        .populate("exam", "examName passingPercentage")
        .sort({ rank: 1, percentage: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ExamResultSummary.countDocuments(filter),
    ]);

    return res.json({ success: true, results, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const computeResults = async (req, res) => {
  try {
    const { exam, className, section } = req.body;

    if (!exam || !className || !section)
      return res.status(400).json({ success: false, message: "Exam, class and section are required" });

    const examDoc = await Exam.findById(exam).select("passingPercentage academicYear").lean();
    if (!examDoc) return res.status(404).json({ success: false, message: "Exam not found" });

    const grades = await getGrades(examDoc.academicYear);

    // Get all marks for this exam/class/section
    const allMarks = await MarksEntry.find({ exam, className, section, isDraft: false })
      .populate("student", "studentId admissionNo firstName lastName")
      .lean();

    if (!allMarks.length)
      return res.status(400).json({ success: false, message: "No marks found. Please enter and save marks first." });

    // Group by student
    const byStudent = {};
    for (const m of allMarks) {
      const sid = m.student._id.toString();
      if (!byStudent[sid]) byStudent[sid] = { student: m.student, subjects: [] };
      byStudent[sid].subjects.push(m);
    }

    const results = [];
    for (const [sid, data] of Object.entries(byStudent)) {
      const totalMax = data.subjects.reduce((s, m) => s + m.maxMarks, 0);
      const totalObtained = data.subjects.reduce((s, m) => s + m.marksObtained, 0);
      const pct = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
      const grade = computeGrade(pct, grades);
      const allPassed = data.subjects.every((m) => m.isPassed || m.isAbsent);
      const resultStatus = pct >= examDoc.passingPercentage && allPassed ? "PASS" : "FAIL";
      const division = computeDivision(pct);

      const subjectResults = data.subjects.map((m) => ({
        subject: m.subject,
        subjectName: m.subjectName,
        maxMarks: m.maxMarks,
        marksObtained: m.marksObtained,
        percentage: m.percentage,
        grade: m.grade,
        isPassed: m.isPassed,
        isAbsent: m.isAbsent,
      }));

      results.push({ sid, student: data.student._id, pct, grade, resultStatus, division,
                     totalMax, totalObtained, subjectResults });
    }

    // Rank by percentage descending
    results.sort((a, b) => b.pct - a.pct);
    results.forEach((r, i) => { r.rank = i + 1; });

    // Upsert ExamResultSummary
    const bulkOps = results.map((r) => ({
      updateOne: {
        filter: { exam, student: r.student },
        update: {
          $set: {
            exam, student: r.student, academicYear: examDoc.academicYear,
            className, section,
            totalMaxMarks: r.totalMax, totalMarksObtained: r.totalObtained,
            percentage: r.pct, grade: r.grade, rank: r.rank,
            division: r.division, resultStatus: r.resultStatus,
            subjectResults: r.subjectResults,
            isPublished: false,
          },
        },
        upsert: true,
      },
    }));

    await ExamResultSummary.bulkWrite(bulkOps, { ordered: false });
    await audit("RESULT_COMPUTED", exam, req, `Computed results for ${className} ${section}: ${results.length} students`);

    return res.json({ success: true, message: `Results computed for ${results.length} students`, count: results.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const publishResult = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid result id" });

    const result = await ExamResultSummary.findById(id);
    if (!result) return res.status(404).json({ success: false, message: "Result not found" });

    result.isPublished = true;
    await result.save();

    // Bridge to legacy ExamResult model for promotion module
    await ExamResult.findOneAndUpdate(
      { student: result.student, academicYear: result.academicYear },
      { $set: {
          student: result.student, academicYear: result.academicYear,
          className: result.className, sectionName: result.section,
          finalPercentage: result.percentage,
          resultStatus: result.resultStatus,
          remarks: result.division,
        }
      },
      { upsert: true }
    );

    await audit("RESULT_PUBLISHED", result.exam, req, `Published result for student ${result.student}`);
    return res.json({ success: true, message: "Result published successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const bulkPublishResults = async (req, res) => {
  try {
    const { exam, className, section } = req.body;

    if (!exam || !className || !section)
      return res.status(400).json({ success: false, message: "Exam, class and section are required" });

    const results = await ExamResultSummary.find({ exam, className, section, isPublished: false });
    if (!results.length)
      return res.status(400).json({ success: false, message: "No unpublished results found" });

    await ExamResultSummary.updateMany(
      { exam, className, section },
      { $set: { isPublished: true } }
    );

    // Bridge to legacy ExamResult
    const bridgeOps = results.map((r) => ({
      updateOne: {
        filter: { student: r.student, academicYear: r.academicYear },
        update: {
          $set: {
            student: r.student, academicYear: r.academicYear,
            className: r.className, sectionName: r.section,
            finalPercentage: r.percentage,
            resultStatus: r.resultStatus,
            remarks: r.division,
          },
        },
        upsert: true,
      },
    }));

    await ExamResult.bulkWrite(bridgeOps, { ordered: false });
    await audit("BULK_RESULT_PUBLISHED", exam, req, `Bulk published ${results.length} results for ${className} ${section}`);
    return res.json({ success: true, message: `${results.length} results published successfully` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// GRADE CONFIG
// ─────────────────────────────────────────────

export const getGradeConfig = async (req, res) => {
  try {
    const { academicYear } = req.query;
    let cfg = null;
    if (academicYear && mongoose.Types.ObjectId.isValid(academicYear)) {
      cfg = await GradeConfig.findOne({ academicYear }).lean();
    }
    if (!cfg) cfg = await GradeConfig.findOne({ isDefault: true }).lean();
    if (!cfg) cfg = { grades: DEFAULT_GRADES, isDefault: true };

    return res.json({ success: true, gradeConfig: cfg });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const saveGradeConfig = async (req, res) => {
  try {
    const { academicYear, grades, label, isDefault } = req.body;
    if (!Array.isArray(grades) || !grades.length)
      return res.status(400).json({ success: false, message: "Grade ranges are required" });

    // Validate no overlaps
    for (let i = 0; i < grades.length; i++) {
      const g = grades[i];
      if (g.minPercent > g.maxPercent)
        return res.status(400).json({ success: false, message: `Grade ${g.grade}: min cannot exceed max` });
    }

    const filter = academicYear ? { academicYear } : { isDefault: true };
    const update = {
      grades, label: label || "Custom Grading",
      isDefault: !academicYear || !!isDefault,
      academicYear: academicYear || null,
    };

    const cfg = await GradeConfig.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true });
    await audit("GRADE_CONFIG_UPDATED", null, req, `Grade config updated`);
    return res.json({ success: true, message: "Grade configuration saved", gradeConfig: cfg });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────

export const getAnalyticsOverview = async (req, res) => {
  try {
    const { exam, academicYear, className, section, examType, subject } = req.query;
    const filter = {};
    if (academicYear && mongoose.Types.ObjectId.isValid(academicYear))
      filter.academicYear = new mongoose.Types.ObjectId(academicYear);
    if (className) filter.className = className;
    if (section) filter.section = section;

    if (exam && mongoose.Types.ObjectId.isValid(exam)) {
      filter.exam = new mongoose.Types.ObjectId(exam);
    } else if (examType && mongoose.Types.ObjectId.isValid(examType)) {
      const examIds = await Exam.find({ examType }).distinct("_id");
      filter.exam = { $in: examIds };
    }

    const getMonthName = (date) => {
      if (!date) return "Unknown";
      return new Date(date).toLocaleString("default", { month: "short" });
    };

    if (subject && mongoose.Types.ObjectId.isValid(subject)) {
      const marksFilter = { ...filter, subject: new mongoose.Types.ObjectId(subject) };
      const marks = await MarksEntry.find(marksFilter)
        .populate("student", "firstName lastName")
        .populate("exam", "startDate examName")
        .lean();

      const total = marks.length;
      const passed = marks.filter((m) => m.isPassed && !m.isAbsent).length;
      const failed = total - passed;
      const passPercent = total > 0 ? parseFloat(((passed / total) * 100).toFixed(2)) : 0;
      const classAvg = total > 0 ? parseFloat((marks.reduce((s, m) => s + m.percentage, 0) / total).toFixed(2)) : 0;

      let highest = 0;
      let lowest = 100;
      let topper = "—";
      if (total > 0) {
        lowest = marks[0].percentage;
        marks.forEach((m) => {
          if (m.percentage > highest) {
            highest = m.percentage;
            topper = m.student ? `${m.student.firstName} ${m.student.lastName}` : "—";
          }
          if (m.percentage < lowest) {
            lowest = m.percentage;
          }
        });
      } else {
        lowest = 0;
      }

      // Grade Distribution
      const gradeMap = {};
      marks.forEach((m) => {
        const g = m.grade || "F";
        gradeMap[g] = (gradeMap[g] || 0) + 1;
      });
      const gradeDistribution = Object.entries(gradeMap).map(([grade, count]) => ({ grade, count }));

      // Class Performance
      const classMap = {};
      marks.forEach((m) => {
        const k = m.className;
        if (!classMap[k]) classMap[k] = { sum: 0, count: 0 };
        classMap[k].sum += m.percentage;
        classMap[k].count++;
      });
      const classPerformance = Object.entries(classMap).map(([className, d]) => ({
        className,
        avgPercent: parseFloat((d.sum / d.count).toFixed(2)),
        count: d.count
      })).sort((a, b) => b.avgPercent - a.avgPercent);

      // Section Performance
      const sectionMap = {};
      marks.forEach((m) => {
        const k = `${m.className} - ${m.section}`;
        if (!sectionMap[k]) sectionMap[k] = { sum: 0, count: 0 };
        sectionMap[k].sum += m.percentage;
        sectionMap[k].count++;
      });
      const sectionPerformance = Object.entries(sectionMap).map(([sectionName, d]) => ({
        sectionName,
        avgPercent: parseFloat((d.sum / d.count).toFixed(2)),
        count: d.count
      })).sort((a, b) => b.avgPercent - a.avgPercent);

      // Monthly Trend
      const monthMap = {};
      marks.forEach((m) => {
        const month = getMonthName(m.exam?.startDate);
        if (!monthMap[month]) monthMap[month] = { sum: 0, count: 0, examIds: new Set() };
        monthMap[month].sum += m.percentage;
        monthMap[month].count++;
        if (m.exam?._id) monthMap[month].examIds.add(m.exam._id.toString());
      });
      const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyTrend = Object.entries(monthMap).map(([month, d]) => ({
        month,
        avgPercent: parseFloat((d.sum / d.count).toFixed(2)),
        examCount: d.examIds.size
      })).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

      const subjectPerformance = [{
        subjectName: marks[0]?.subjectName || "Selected Subject",
        avgPercent: classAvg,
        passPercent,
        failPercent: parseFloat((100 - passPercent).toFixed(2)),
        highest,
        lowest,
        count: total
      }];

      return res.json({
        success: true,
        overview: { total, passed, failed, passPercent, classAvg, highest, lowest, topper },
        gradeDistribution,
        classPerformance,
        sectionPerformance,
        monthlyTrend,
        subjectPerformance
      });

    } else {
      const results = await ExamResultSummary.find(filter)
        .populate("student", "firstName lastName")
        .populate("exam", "startDate examName")
        .lean();

      const total = results.length;
      const passed = results.filter((r) => r.resultStatus === "PASS").length;
      const failed = total - passed;
      const passPercent = total > 0 ? parseFloat(((passed / total) * 100).toFixed(2)) : 0;
      const classAvg = total > 0 ? parseFloat((results.reduce((s, r) => s + r.percentage, 0) / total).toFixed(2)) : 0;

      let highest = 0;
      let lowest = 100;
      let topper = "—";
      if (total > 0) {
        lowest = results[0].percentage;
        results.forEach((r) => {
          if (r.percentage > highest) {
            highest = r.percentage;
            topper = r.student ? `${r.student.firstName} ${r.student.lastName}` : "—";
          }
          if (r.percentage < lowest) {
            lowest = r.percentage;
          }
        });
      } else {
        lowest = 0;
      }

      // Grade Distribution
      const gradeMap = {};
      results.forEach((r) => {
        const g = r.grade || "F";
        gradeMap[g] = (gradeMap[g] || 0) + 1;
      });
      const gradeDistribution = Object.entries(gradeMap).map(([grade, count]) => ({ grade, count }));

      // Class Performance
      const classMap = {};
      results.forEach((r) => {
        const k = r.className;
        if (!classMap[k]) classMap[k] = { sum: 0, count: 0 };
        classMap[k].sum += r.percentage;
        classMap[k].count++;
      });
      const classPerformance = Object.entries(classMap).map(([className, d]) => ({
        className,
        avgPercent: parseFloat((d.sum / d.count).toFixed(2)),
        count: d.count
      })).sort((a, b) => b.avgPercent - a.avgPercent);

      // Section Performance
      const sectionMap = {};
      results.forEach((r) => {
        const k = `${r.className} - ${r.section}`;
        if (!sectionMap[k]) sectionMap[k] = { sum: 0, count: 0 };
        sectionMap[k].sum += r.percentage;
        sectionMap[k].count++;
      });
      const sectionPerformance = Object.entries(sectionMap).map(([sectionName, d]) => ({
        sectionName,
        avgPercent: parseFloat((d.sum / d.count).toFixed(2)),
        count: d.count
      })).sort((a, b) => b.avgPercent - a.avgPercent);

      // Monthly Trend
      const monthMap = {};
      results.forEach((r) => {
        const month = getMonthName(r.exam?.startDate);
        if (!monthMap[month]) monthMap[month] = { sum: 0, count: 0, examIds: new Set() };
        monthMap[month].sum += r.percentage;
        monthMap[month].count++;
        if (r.exam?._id) monthMap[month].examIds.add(r.exam._id.toString());
      });
      const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyTrend = Object.entries(monthMap).map(([month, d]) => ({
        month,
        avgPercent: parseFloat((d.sum / d.count).toFixed(2)),
        examCount: d.examIds.size
      })).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));

      // Subject Performance
      const marksFilter = { ...filter };
      const allMarks = await MarksEntry.find(marksFilter).lean();
      const bySubject = {};
      allMarks.forEach((m) => {
        const k = m.subjectName || m.subject?.toString() || "Unknown";
        if (!bySubject[k]) bySubject[k] = { sum: 0, count: 0, passed: 0, highest: 0, lowest: 100 };
        bySubject[k].sum += m.percentage;
        bySubject[k].count++;
        if (m.isPassed) bySubject[k].passed++;
        if (m.percentage > bySubject[k].highest) bySubject[k].highest = m.percentage;
        if (m.percentage < bySubject[k].lowest) bySubject[k].lowest = m.percentage;
      });

      const subjectPerformance = Object.entries(bySubject).map(([name, d]) => ({
        subjectName: name,
        avgPercent: parseFloat((d.sum / d.count).toFixed(2)),
        passPercent: parseFloat(((d.passed / d.count) * 100).toFixed(2)),
        failPercent: parseFloat((((d.count - d.passed) / d.count) * 100).toFixed(2)),
        highest: d.highest,
        lowest: d.lowest === 100 ? 0 : d.lowest,
        count: d.count
      })).sort((a, b) => b.avgPercent - a.avgPercent);

      return res.json({
        success: true,
        overview: { total, passed, failed, passPercent, classAvg, highest, lowest, topper },
        gradeDistribution,
        classPerformance,
        sectionPerformance,
        monthlyTrend,
        subjectPerformance
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTopStudents = async (req, res) => {
  try {
    const { exam, academicYear, className, section, examType, subject, limit = 10, order = "top" } = req.query;
    const filter = {};
    if (academicYear && mongoose.Types.ObjectId.isValid(academicYear)) filter.academicYear = academicYear;
    if (className) filter.className = className;
    if (section) filter.section = section;

    if (exam && mongoose.Types.ObjectId.isValid(exam)) {
      filter.exam = exam;
    } else if (examType && mongoose.Types.ObjectId.isValid(examType)) {
      const examIds = await Exam.find({ examType }).distinct("_id");
      filter.exam = { $in: examIds };
    }

    const sortOrder = order === "bottom" ? 1 : -1;

    if (subject && mongoose.Types.ObjectId.isValid(subject)) {
      filter.subject = subject;
      const marks = await MarksEntry.find(filter)
        .populate("student", "studentId admissionNo firstName lastName photoUrl")
        .populate("exam", "examName")
        .sort({ percentage: sortOrder })
        .limit(Number(limit))
        .lean();

      const students = marks.map((m, idx) => ({
        _id: m._id,
        student: m.student,
        exam: m.exam,
        className: m.className,
        section: m.section,
        percentage: m.percentage,
        grade: m.grade,
        resultStatus: m.isPassed ? "PASS" : "FAIL",
        rank: idx + 1,
      }));
      return res.json({ success: true, students });
    } else {
      const students = await ExamResultSummary.find(filter)
        .populate("student", "studentId admissionNo firstName lastName photoUrl")
        .populate("exam", "examName")
        .sort({ percentage: sortOrder })
        .limit(Number(limit))
        .lean();

      return res.json({ success: true, students });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { exam, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (exam && mongoose.Types.ObjectId.isValid(exam)) filter.exam = exam;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      ExamAuditLog.find(filter)
        .populate("performedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ExamAuditLog.countDocuments(filter),
    ]);

    return res.json({ success: true, logs, total });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
