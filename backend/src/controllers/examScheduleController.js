import mongoose from "mongoose";
import ExamSchedule from "../models/ExamSchedule.js";
import Exam from "../models/Exam.js";
import ExamAuditLog from "../models/ExamAuditLog.js";

const getClientIp = (req) =>
  req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";

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
  } catch (_) {}
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

export const getSchedules = async (req, res) => {
  try {
    const { examId, classId, section } = req.query;
    const filter = {};
    if (examId && mongoose.Types.ObjectId.isValid(examId))
      filter.exam = new mongoose.Types.ObjectId(examId);
    if (classId && mongoose.Types.ObjectId.isValid(classId))
      filter.classId = new mongoose.Types.ObjectId(classId);
    if (section) filter.section = section;

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
    const { academicYear, exam, examType, examTypeName, classId, className, section, subject, subjectName,
            examDate, startTime, endTime, room, invigilator, maxMarks, passingMarks, status, instructions } = req.body;

    if (!academicYear || !exam || !examType || !classId || !section || !subject || !examDate || !startTime || !endTime || maxMarks === undefined || passingMarks === undefined) {
      return res.status(400).json({ success: false, message: "Please fill all required fields" });
    }

    const marksMax = Number(maxMarks);
    const marksPass = Number(passingMarks);
    if (isNaN(marksMax) || isNaN(marksPass) || marksMax < 1 || marksPass < 0 || marksPass > marksMax) {
      return res.status(400).json({ success: false, message: "Passing marks cannot exceed maximum marks." });
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({ success: false, message: "End time must be after start time" });
    }

    const scheduleDate = new Date(examDate);
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid exam date format." });
    }

    const startOfDay = new Date(new Date(scheduleDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(scheduleDate).setHours(23, 59, 59, 999));

    // Overlapping slots conflict checking on same date
    const overlappingSchedules = await ExamSchedule.find({
      examDate: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    for (const s of overlappingSchedules) {
      if (timesOverlap(startTime, endTime, s.startTime, s.endTime)) {
        // Same Class + Section
        if (String(s.classId) === String(classId) && s.section === section) {
          return res.status(400).json({ success: false, message: "Schedule conflict detected." });
        }
        // Same Room
        if (room && s.room && s.room.trim().toLowerCase() === room.trim().toLowerCase()) {
          return res.status(400).json({ success: false, message: "Schedule conflict detected." });
        }
        // Same Invigilator
        if (invigilator && s.invigilator && s.invigilator.trim().toLowerCase() === invigilator.trim().toLowerCase()) {
          return res.status(400).json({ success: false, message: "Schedule conflict detected." });
        }
        // Same Subject
        if (String(s.subject) === String(subject)) {
          return res.status(400).json({ success: false, message: "Schedule conflict detected." });
        }
      }
    }

    const examDoc = await Exam.findById(exam).select("examName").lean();
    const entry = await ExamSchedule.create({
      academicYear, exam, examName: examDoc?.examName || "",
      examType, examTypeName: examTypeName || "",
      classId, className, section,
      subject, subjectName, examDate: scheduleDate, startTime, endTime,
      room: room || "", invigilator: invigilator || "",
      maxMarks: marksMax, passingMarks: marksPass,
      status: status || "Scheduled",
      instructions: instructions || "",
    });

    await audit("SCHEDULE_CREATED", exam, req, `Schedule: ${subjectName} for ${className} ${section}`);
    return res.status(201).json({ success: true, message: "Schedule created successfully", entry });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ success: false, message: "Schedule conflict detected." });
    }
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

    const { examDate, startTime, endTime, room, invigilator, instructions, maxMarks, passingMarks, status } = req.body;

    const newDate = examDate !== undefined ? examDate : entry.examDate;
    const newStart = startTime !== undefined ? startTime : entry.startTime;
    const newEnd = endTime !== undefined ? endTime : entry.endTime;
    const newRoom = room !== undefined ? room : entry.room;
    const newInvig = invigilator !== undefined ? invigilator : entry.invigilator;
    const newMax = maxMarks !== undefined ? Number(maxMarks) : entry.maxMarks;
    const newPass = passingMarks !== undefined ? Number(passingMarks) : entry.passingMarks;

    if (isNaN(newMax) || isNaN(newPass) || newMax < 1 || newPass < 0 || newPass > newMax) {
      return res.status(400).json({ success: false, message: "Passing marks cannot exceed maximum marks." });
    }

    if (timeToMinutes(newStart) >= timeToMinutes(newEnd)) {
      return res.status(400).json({ success: false, message: "End time must be after start time" });
    }

    const scheduleDate = new Date(newDate);
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid exam date format." });
    }

    const startOfDay = new Date(new Date(scheduleDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(scheduleDate).setHours(23, 59, 59, 999));

    // Overlapping slots conflict checking on same date (excluding self)
    const overlappingSchedules = await ExamSchedule.find({
      _id: { $ne: id },
      examDate: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    for (const s of overlappingSchedules) {
      if (timesOverlap(newStart, newEnd, s.startTime, s.endTime)) {
        // Same Class + Section
        if (String(s.classId) === String(entry.classId) && s.section === entry.section) {
          return res.status(400).json({ success: false, message: "Schedule conflict detected." });
        }
        // Same Room
        if (newRoom && s.room && s.room.trim().toLowerCase() === newRoom.trim().toLowerCase()) {
          return res.status(400).json({ success: false, message: "Schedule conflict detected." });
        }
        // Same Invigilator
        if (newInvig && s.invigilator && s.invigilator.trim().toLowerCase() === newInvig.trim().toLowerCase()) {
          return res.status(400).json({ success: false, message: "Schedule conflict detected." });
        }
        // Same Subject
        if (String(s.subject) === String(entry.subject)) {
          return res.status(400).json({ success: false, message: "Schedule conflict detected." });
        }
      }
    }

    entry.examDate = scheduleDate;
    entry.startTime = newStart;
    entry.endTime = newEnd;
    entry.room = newRoom || "";
    entry.invigilator = newInvig || "";
    entry.maxMarks = newMax;
    entry.passingMarks = newPass;
    if (status !== undefined) entry.status = status;
    if (instructions !== undefined) entry.instructions = instructions;

    await entry.save();
    await audit("SCHEDULE_UPDATED", entry.exam, req, `Updated schedule: ${entry.subjectName}`);
    return res.json({ success: true, message: "Schedule updated successfully", entry });
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
    await audit("SCHEDULE_DELETED", entry.exam, req, `Deleted schedule: ${entry.subjectName}`);
    return res.json({ success: true, message: "Schedule deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
