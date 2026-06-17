import mongoose from "mongoose";
import StudentAttendance from "../models/StudentAttendance.js";
import StaffAttendance from "../models/StaffAttendance.js";
import AttendanceSummary from "../models/AttendanceSummary.js";
import AcademicYear from "../models/AcademicYear.js";
import ClassSection from "../models/ClassSection.js";
import Student from "../models/Student.js";
import Staff from "../models/Staff.js";
import StaffActivityLog from "../models/StaffActivityLog.js"; // to log staff audit timeline actions
import StudentActivityLog from "../models/StudentActivityLog.js"; // if student audit log exists

// Helper to log audit actions
const logAudit = async (userId, action, details) => {
  try {
    if (StudentActivityLog) {
      await StudentActivityLog.create({
        action,
        performedBy: userId,
        details,
      });
    }
  } catch (err) {
    console.error("Audit logging error:", err.message);
  }
};

// Helper to parse time strings like "09:15 AM" into total minutes
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  let [_, hours, minutes, ampm] = match;
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  if (ampm.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// 1. Dependency Validation Checks
export const checkAttendanceDependencies = async (req, res) => {
  try {
    const hasAcademicYear = (await AcademicYear.countDocuments()) > 0;
    const hasClassSection = (await ClassSection.countDocuments()) > 0;
    const hasStudents = (await Student.countDocuments()) > 0;
    const hasStaff = (await Staff.countDocuments()) > 0;

    return res.status(200).json({
      success: true,
      data: {
        hasAcademicYear,
        hasClassSection,
        hasStudents,
        hasStaff,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Attendance Dashboard Metrics Summary
export const getAttendanceDashboard = async (req, res) => {
  try {
    const { date } = req.query;
    const searchDate = date ? new Date(date) : new Date();
    searchDate.setUTCHours(0, 0, 0, 0);

    // Students count
    const totalStudents = await Student.countDocuments({ status: "Active" });
    const studentLogs = await StudentAttendance.find({ date: searchDate });
    
    let presentStudents = 0;
    let absentStudents = 0;
    let lateStudents = 0;
    let halfDayStudents = 0;

    studentLogs.forEach((log) => {
      if (log.status === "Present") presentStudents++;
      else if (log.status === "Absent") absentStudents++;
      else if (log.status === "Late") lateStudents++;
      else if (log.status === "Half Day") halfDayStudents++;
    });

    const studentPercentage = totalStudents > 0
      ? Math.round(((presentStudents + lateStudents + (halfDayStudents * 0.5)) / totalStudents) * 100)
      : 100;

    // Staff count
    const totalStaff = await Staff.countDocuments({ status: "Active" });
    const staffLogs = await StaffAttendance.find({ date: searchDate });

    let presentStaff = 0;
    let absentStaff = 0;
    let staffOnLeave = 0;

    staffLogs.forEach((log) => {
      if (log.status === "Present" || log.status === "Work From Home") presentStaff++;
      else if (log.status === "Absent") absentStaff++;
      else if (log.status === "On Leave") staffOnLeave++;
    });

    const staffPercentage = totalStaff > 0
      ? Math.round(((presentStaff) / totalStaff) * 100)
      : 100;

    return res.status(200).json({
      success: true,
      data: {
        student: {
          total: totalStudents,
          present: presentStudents,
          absent: absentStudents,
          late: lateStudents,
          percentage: studentPercentage,
        },
        staff: {
          total: totalStaff,
          present: presentStaff,
          absent: absentStaff,
          onLeave: staffOnLeave,
          percentage: staffPercentage,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Student Attendance List & Marking
export const getStudentAttendanceList = async (req, res) => {
  try {
    const { className, sectionName, date } = req.query;
    if (!className || !sectionName || !date) {
      return res.status(400).json({
        success: false,
        message: "Class name, section name, and date are required parameters.",
      });
    }

    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    const students = await Student.find({ className, sectionName, status: "Active" })
      .select("firstName lastName studentId admissionNo photoUrl className sectionName")
      .sort({ firstName: 1 });

    const attendanceLogs = await StudentAttendance.find({
      class: className,
      section: sectionName,
      date: searchDate,
    });

    return res.status(200).json({
      success: true,
      students,
      attendance: attendanceLogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markStudentAttendance = async (req, res) => {
  try {
    const { date, className, sectionName, academicYearId, records } = req.body; // records: [{ studentId, status, remarks }]
    if (!date || !className || !sectionName || !academicYearId || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "Date, class, section, academic year and records array are required.",
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Prevent marking attendance for future dates
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (attendanceDate > today) {
      return res.status(400).json({
        success: false,
        message: "Cannot mark attendance for future dates.",
      });
    }

    const operations = records.map((rec) => ({
      updateOne: {
        filter: { student: rec.studentId, date: attendanceDate },
        update: {
          $set: {
            academicYear: academicYearId,
            class: className,
            section: sectionName,
            status: rec.status,
            remarks: rec.remarks || "",
            markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    await StudentAttendance.bulkWrite(operations);

    // Generate notification list for absent/late students for future WhatsApp/SMS integrations
    const absentLogs = records.filter((r) => r.status === "Absent");
    const lateLogs = records.filter((r) => r.status === "Late");

    // Log Activity
    await logAudit(
      req.user._id,
      "Bulk Attendance Action",
      `Marked attendance for Class ${className}-${sectionName} on ${attendanceDate.toLocaleDateString()}. Absents: ${absentLogs.length}.`
    );

    return res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      summary: {
        totalMarked: records.length,
        absentCount: absentLogs.length,
        lateCount: lateLogs.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteStudentAttendance = async (req, res) => {
  try {
    const { className, sectionName, date } = req.query;
    if (!className || !sectionName || !date) {
      return res.status(400).json({
        success: false,
        message: "Class name, section name, and date are required.",
      });
    }

    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    await StudentAttendance.deleteMany({
      class: className,
      section: sectionName,
      date: searchDate,
    });

    await logAudit(
      req.user._id,
      "Attendance Deleted",
      `Cleared attendance logs for ${className}-${sectionName} on ${searchDate.toLocaleDateString()}.`
    );

    return res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Staff Attendance List & Marking (Biometric ready)
export const getStaffAttendanceList = async (req, res) => {
  try {
    const { date, departmentId, designationId } = req.query;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required.",
      });
    }

    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    const query = { status: "Active" };
    if (departmentId) query.department = departmentId;
    if (designationId) query.designation = designationId;

    const staffList = await Staff.find(query)
      .populate("department", "departmentName")
      .populate("designation", "designationName")
      .select("firstName lastName employeeId photoUrl department designation mobile status salary")
      .sort({ firstName: 1 });

    const attendanceLogs = await StaffAttendance.find({ date: searchDate });

    return res.status(200).json({
      success: true,
      staffList,
      attendance: attendanceLogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const markStaffAttendance = async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{ staffId, status, checkIn, checkOut, remarks }]
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "Date and records array are required.",
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (attendanceDate > today) {
      return res.status(400).json({
        success: false,
        message: "Cannot mark attendance for future dates.",
      });
    }

    const operations = [];

    for (const rec of records) {
      // Find staff to fetch department and designation
      const staff = await Staff.findById(rec.staffId);
      if (!staff) continue;

      let workingHours = 0;
      let lateArrival = false;
      let earlyDeparture = false;

      if (rec.status === "Present" || rec.status === "Late" || rec.status === "Half Day" || rec.status === "Work From Home") {
        const checkInMin = parseTimeToMinutes(rec.checkIn || "09:00 AM");
        const checkOutMin = parseTimeToMinutes(rec.checkOut || "05:00 PM");

        if (checkInMin !== null && checkOutMin !== null) {
          workingHours = Math.max(0, parseFloat(((checkOutMin - checkInMin) / 60).toFixed(1)));
        }

        // Standard timing thresholds (Standard CheckIn: 09:15 AM, Standard CheckOut: 05:00 PM)
        if (checkInMin > 555) lateArrival = true;
        if (checkOutMin < 1020) earlyDeparture = true;
      }

      operations.push({
        updateOne: {
          filter: { staff: rec.staffId, date: attendanceDate },
          update: {
            $set: {
              department: staff.department,
              designation: staff.designation,
              status: rec.status,
              checkIn: rec.checkIn || "",
              checkOut: rec.checkOut || "",
              workingHours,
              lateArrival,
              earlyDeparture,
              remarks: rec.remarks || "",
              markedBy: req.user._id,
            },
          },
          upsert: true,
        },
      });
    }

    if (operations.length > 0) {
      await StaffAttendance.bulkWrite(operations);
    }

    return res.status(200).json({
      success: true,
      message: "Staff attendance register updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteStaffAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required.",
      });
    }

    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    await StaffAttendance.deleteMany({ date: searchDate });

    return res.status(200).json({
      success: true,
      message: "Staff attendance registers cleared.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Attendance Reports (Student, Staff, Department, Class)
export const getAttendanceReports = async (req, res) => {
  try {
    const { type, month, year, className, sectionName, departmentId, designationId } = req.query;
    
    if (!type || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Type, Month and Year are required query values.",
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    if (type === "student") {
      const query = { date: { $gte: startDate, $lte: endDate } };
      if (className) query.class = className;
      if (sectionName) query.section = sectionName;

      const logs = await StudentAttendance.find(query)
        .populate("student", "firstName lastName studentId admissionNo className sectionName")
        .sort({ date: 1 });

      return res.status(200).json({ success: true, data: logs });
    } else {
      const query = { date: { $gte: startDate, $lte: endDate } };
      if (departmentId) query.department = departmentId;
      if (designationId) query.designation = designationId;

      const logs = await StaffAttendance.find(query)
        .populate("staff", "firstName lastName employeeId department designation mobile")
        .populate("department", "departmentName")
        .populate("designation", "designationName")
        .sort({ date: 1 });

      return res.status(200).json({ success: true, data: logs });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Attendance Analytics Trends Curves
export const getAttendanceAnalytics = async (req, res) => {
  try {
    const { type } = req.query; // student or staff
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (type === "staff") {
      const logs = await StaffAttendance.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: "$date",
            total: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $in: ["$status", ["Present", "Work From Home", "Late"]] }, 1, 0],
              },
            },
            late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const analytics = logs.map((log) => ({
        date: log._id.toISOString().split("T")[0],
        rate: log.total > 0 ? Math.round((log.present / log.total) * 100) : 100,
        late: log.late,
      }));

      return res.status(200).json({ success: true, analytics });
    } else {
      const logs = await StudentAttendance.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: "$date",
            total: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $in: ["$status", ["Present", "Late"]] }, 1, 0],
              },
            },
            late: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const analytics = logs.map((log) => ({
        date: log._id.toISOString().split("T")[0],
        rate: log.total > 0 ? Math.round((log.present / log.total) * 100) : 100,
        late: log.late,
      }));

      return res.status(200).json({ success: true, analytics });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
