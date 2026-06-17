import Student from "../models/Student.js";
import ExamResult from "../models/ExamResult.js";
import StudentAttendanceLog from "../models/StudentAttendanceLog.js";
import Admission from "../models/Admission.js";
import StudentActivityLog from "../models/StudentActivityLog.js";
import AcademicYear from "../models/AcademicYear.js";

// Helper to determine next class
const getNextClass = (currentClass) => {
  if (currentClass === "Class 12") return "Passed Out";
  const num = parseInt(currentClass.replace(/[^0-9]/g, ""), 10);
  if (!isNaN(num)) {
    return `Class ${num + 1}`;
  }
  return currentClass; // default fallback
};

// Get promotion candidates with validation checklist
export const getPromotionCandidates = async (req, res) => {
  try {
    const { academicYearId, className, sectionName } = req.query;

    if (!academicYearId || !className || !sectionName) {
      return res.status(400).json({
        success: false,
        message: "Academic Year, Class and Section are required.",
      });
    }

    // Enquiries active students
    const students = await Student.find({
      academicYear: academicYearId,
      className,
      sectionName,
      status: "Active",
    });

    const candidates = [];

    for (let student of students) {
      // 1. Check if exam results exist and status is PASS
      const result = await ExamResult.findOne({
        student: student._id,
        academicYear: academicYearId,
      });

      let isEligible = true;
      let eligibilityStatus = "Eligible";
      let reason = "";
      let finalPercentage = 0;
      let resultStatus = "PENDING";

      if (!result) {
        isEligible = false;
        eligibilityStatus = "Result Pending";
        reason = "Final exam results not available.";
      } else {
        finalPercentage = result.finalPercentage;
        resultStatus = result.resultStatus;
        if (resultStatus !== "PASS") {
          isEligible = false;
          eligibilityStatus = "FAIL";
          reason = "Student failed final examination.";
        }
      }

      // 2. Attendance Validation (>= 75%)
      if (isEligible) {
        const logs = await StudentAttendanceLog.find({ student: student._id });
        const total = logs.length;
        const presentCount = logs.filter((l) => l.status === "Present" || l.status === "Late").length;
        const attendancePercent = total > 0 ? (presentCount / total) * 100 : 80; // Default 80% if no logs yet

        if (attendancePercent < 75) {
          isEligible = false;
          eligibilityStatus = "Low Attendance";
          reason = `Attendance is ${Math.round(attendancePercent)}% (required >= 75%).`;
        }
      }

      // 3. Document Validation (No pending mandatory documents)
      if (isEligible) {
        const admission = await Admission.findById(student.admissionId);
        const hasPhoto = admission?.documents?.some((d) => d.docType === "Student Photo" && d.status === "Verified");
        const hasBirthCert = admission?.documents?.some((d) => d.docType === "Birth Certificate" && d.status === "Verified");

        if (!hasPhoto || !hasBirthCert) {
          isEligible = false;
          eligibilityStatus = "Missing Docs";
          reason = "Mandatory documents (Photo / Birth Cert) are not verified.";
        }
      }

      // 4. Double promotion check
      if (isEligible) {
        const alreadyPromoted = student.promotionHistory.some(
          (p) => String(p.fromAcademicYear) === String(academicYearId)
        );
        if (alreadyPromoted) {
          isEligible = false;
          eligibilityStatus = "Already Promoted";
          reason = "Student has already been promoted for this session.";
        }
      }

      candidates.push({
        _id: student._id,
        studentId: student.studentId,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        currentClass: student.className,
        sectionName: student.sectionName,
        finalPercentage,
        resultStatus,
        isEligible,
        eligibilityStatus,
        reason,
        nextClass: getNextClass(student.className),
      });
    }

    res.status(200).json({
      success: true,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Promote a single student
export const promoteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetAcademicYearId, targetSection, targetStream } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    const currentYearId = student.academicYear;
    const currentClass = student.className;
    const currentSection = student.sectionName;

    // Run promotion validation check
    const exam = await ExamResult.findOne({ student: id, academicYear: currentYearId });
    if (!exam || exam.resultStatus !== "PASS") {
      return res.status(400).json({
        success: false,
        message: "Promotion blocked. Student did not pass the final exam.",
      });
    }

    const logs = await StudentAttendanceLog.find({ student: id });
    const total = logs.length;
    const presentCount = logs.filter((l) => l.status === "Present" || l.status === "Late").length;
    const attendancePercent = total > 0 ? (presentCount / total) * 100 : 80;
    if (attendancePercent < 75) {
      return res.status(400).json({
        success: false,
        message: `Promotion blocked. Attendance is too low (${Math.round(attendancePercent)}%).`,
      });
    }

    const admission = await Admission.findById(student.admissionId);
    const hasPhoto = admission?.documents?.some((d) => d.docType === "Student Photo" && d.status === "Verified");
    const hasBirthCert = admission?.documents?.some((d) => d.docType === "Birth Certificate" && d.status === "Verified");
    if (!hasPhoto || !hasBirthCert) {
      return res.status(400).json({
        success: false,
        message: "Promotion blocked. Mandatory documents are missing or unverified.",
      });
    }

    // Double promotion block
    const alreadyPromoted = student.promotionHistory.some(
      (p) => String(p.fromAcademicYear) === String(currentYearId)
    );
    if (alreadyPromoted) {
      return res.status(400).json({
        success: false,
        message: "Promotion blocked. Student has already been promoted for this session.",
      });
    }

    // Promoted Target Calculation
    const nextClass = getNextClass(currentClass);
    
    // Add record to history
    student.promotionHistory.push({
      fromAcademicYear: currentYearId,
      fromClass: currentClass,
      fromSection: currentSection,
      toAcademicYear: targetAcademicYearId || currentYearId,
      toClass: nextClass,
      toSection: targetSection || currentSection,
      finalPercentage: exam.finalPercentage,
      resultStatus: exam.resultStatus,
      promotedBy: req.user._id,
      promotedAt: new Date(),
    });

    if (nextClass === "Passed Out") {
      student.status = "Passed Out";
    } else {
      student.className = nextClass;
      if (targetSection) student.sectionName = targetSection;
      if (targetAcademicYearId) student.academicYear = targetAcademicYearId;
      if (targetStream) student.stream = targetStream;
    }

    await student.save();

    // Log Activity
    const act = new StudentActivityLog({
      student: student._id,
      action: "Promotion Completed",
      performedBy: req.user._id,
      details: `Student promoted from ${currentClass} to ${nextClass}.`,
    });
    await act.save();

    res.status(200).json({
      success: true,
      message: `Student promoted to ${nextClass} successfully.`,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Bulk promote list of eligible students
export const bulkPromoteStudents = async (req, res) => {
  try {
    const { studentIds, targetAcademicYearId, targetSection } = req.body;

    if (!studentIds || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No student IDs provided.",
      });
    }

    let successCount = 0;
    let failCount = 0;

    for (let id of studentIds) {
      try {
        const student = await Student.findById(id);
        if (!student || student.status !== "Active") {
          failCount++;
          continue;
        }

        const currentYearId = student.academicYear;
        const currentClass = student.className;
        const currentSection = student.sectionName;

        // Perform validations inline
        const exam = await ExamResult.findOne({ student: id, academicYear: currentYearId });
        if (!exam || exam.resultStatus !== "PASS") {
          failCount++;
          continue;
        }

        const logs = await StudentAttendanceLog.find({ student: id });
        const total = logs.length;
        const presentCount = logs.filter((l) => l.status === "Present" || l.status === "Late").length;
        const attendancePercent = total > 0 ? (presentCount / total) * 100 : 80;
        if (attendancePercent < 75) {
          failCount++;
          continue;
        }

        const admission = await Admission.findById(student.admissionId);
        const hasPhoto = admission?.documents?.some((d) => d.docType === "Student Photo" && d.status === "Verified");
        const hasBirthCert = admission?.documents?.some((d) => d.docType === "Birth Certificate" && d.status === "Verified");
        if (!hasPhoto || !hasBirthCert) {
          failCount++;
          continue;
        }

        const alreadyPromoted = student.promotionHistory.some(
          (p) => String(p.fromAcademicYear) === String(currentYearId)
        );
        if (alreadyPromoted) {
          failCount++;
          continue;
        }

        const nextClass = getNextClass(currentClass);

        student.promotionHistory.push({
          fromAcademicYear: currentYearId,
          fromClass: currentClass,
          fromSection: currentSection,
          toAcademicYear: targetAcademicYearId || currentYearId,
          toClass: nextClass,
          toSection: targetSection || currentSection,
          finalPercentage: exam.finalPercentage,
          resultStatus: exam.resultStatus,
          promotedBy: req.user._id,
          promotedAt: new Date(),
        });

        if (nextClass === "Passed Out") {
          student.status = "Passed Out";
        } else {
          student.className = nextClass;
          if (targetSection) student.sectionName = targetSection;
          if (targetAcademicYearId) student.academicYear = targetAcademicYearId;
        }

        await student.save();

        const act = new StudentActivityLog({
          student: student._id,
          action: "Promotion Completed",
          performedBy: req.user._id,
          details: `Student batch promoted from ${currentClass} to ${nextClass}.`,
        });
        await act.save();

        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch promotion completed: ${successCount} promoted, ${failCount} skipped/failed.`,
      data: {
        successCount,
        failCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all promotion histories
export const getPromotionHistory = async (req, res) => {
  try {
    const students = await Student.find({ "promotionHistory.0": { $exists: true } })
      .populate("promotionHistory.fromAcademicYear", "name")
      .populate("promotionHistory.toAcademicYear", "name");

    const logs = [];
    students.forEach((s) => {
      s.promotionHistory.forEach((p) => {
        logs.push({
          _id: p._id,
          studentId: s.studentId,
          studentName: `${s.firstName} ${s.lastName}`,
          academicYear: p.fromAcademicYear?.name || "—",
          previousClass: p.fromClass,
          newClass: p.toClass,
          finalPercentage: p.finalPercentage,
          resultStatus: p.resultStatus,
          promotionDate: p.promotedAt,
        });
      });
    });

    res.status(200).json({
      success: true,
      data: logs.sort((a, b) => new Date(b.promotionDate) - new Date(a.promotionDate)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
