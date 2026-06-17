import Student from "../models/Student.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import ExamResult from "../models/ExamResult.js";
import ClassSection from "../models/ClassSection.js";
import StudentActivityLog from "../models/StudentActivityLog.js";
import StudentAttendanceLog from "../models/StudentAttendanceLog.js";
import TransferCertificate from "../models/TransferCertificate.js";
import AcademicYear from "../models/AcademicYear.js";

// Get all students with search, filters, RBAC, and metrics
export const getStudents = async (req, res) => {
  try {
    const {
      search,
      academicYearId,
      className,
      sectionName,
      stream,
      category,
      gender,
      transportOptIn,
      hostelOptIn,
      status,
    } = req.query;

    let query = {};

    // Enforce Role Based Access Control (RBAC)
    if (req.user.role === "PARENT") {
      // Parents can only view their own children
      query.$or = [
        { fatherEmail: req.user.email },
        { motherEmail: req.user.email },
        { fatherMobile: req.user.mobile },
      ];
    } else if (req.user.role === "STAFF") {
      // Teachers (Staff) can only view students in sections where they are assigned as Class Teacher
      const assignedClasses = await ClassSection.find({
        "sections.classTeacher": req.user.fullName,
      });

      if (assignedClasses.length > 0) {
        const classFilters = [];
        assignedClasses.forEach((c) => {
          c.sections.forEach((s) => {
            if (s.classTeacher === req.user.fullName) {
              classFilters.push({ className: c.className, sectionName: s.sectionName });
            }
          });
        });
        if (classFilters.length > 0) {
          query.$or = classFilters;
        } else {
          return res.status(200).json({ success: true, data: [], metrics: {} });
        }
      }
    }

    // Global Advanced Search
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { studentId: searchRegex },
          { admissionNo: searchRegex },
          { fatherName: searchRegex },
          { motherName: searchRegex },
          { fatherMobile: searchRegex },
          { aadhaarNumber: searchRegex },
        ],
      });
    }

    // Filters
    if (academicYearId) query.academicYear = academicYearId;
    if (className) query.className = className;
    if (sectionName) query.sectionName = sectionName;
    if (stream) query.stream = stream;
    if (category) query.category = category;
    if (gender) query.gender = gender;
    if (transportOptIn) query.needTransport = transportOptIn;
    if (hostelOptIn) query.needHostel = hostelOptIn;
    
    if (status) {
      query.status = status;
    } else {
      // By default, show active students
      query.status = "Active";
    }

    const students = await Student.find(query)
      .populate("academicYear", "name")
      .sort({ studentId: 1 });

    // Enquiries / Metrics aggregates (Calculated on active session context)
    const activeYearFilter = query.academicYear;
    const baseMetricQuery = activeYearFilter ? { academicYear: activeYearFilter } : {};

    const totalStudents = await Student.countDocuments(baseMetricQuery);
    const activeStudents = await Student.countDocuments({ ...baseMetricQuery, status: "Active" });
    const boysCount = await Student.countDocuments({ ...baseMetricQuery, gender: "Male", status: "Active" });
    const girlsCount = await Student.countDocuments({ ...baseMetricQuery, gender: "Female", status: "Active" });
    const transferredCount = await Student.countDocuments({ ...baseMetricQuery, status: "Transferred" });
    const passedOutCount = await Student.countDocuments({ ...baseMetricQuery, status: "Passed Out" });

    // Calculate dynamic average attendance % of active students
    const activeStudentIds = await Student.find({ ...baseMetricQuery, status: "Active" }).distinct("_id");
    const attendanceAgg = await StudentAttendanceLog.aggregate([
      { $match: { student: { $in: activeStudentIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    
    let totalLogs = 0;
    let presentCount = 0;
    attendanceAgg.forEach((item) => {
      totalLogs += item.count;
      if (item._id === "Present" || item._id === "Late") {
        presentCount += item.count;
      }
    });
    const avgAttendance = totalLogs > 0 ? Math.round((presentCount / totalLogs) * 100) : 85; // Default standard base if no logs exist yet

    // Fee Pending count (Unique students with unpaid invoices)
    const feePendingStudentIds = await Invoice.find({ status: "Unpaid" }).distinct("student");
    const feePendingCount = feePendingStudentIds.length;

    res.status(200).json({
      success: true,
      data: students,
      metrics: {
        totalStudents,
        activeStudents,
        boysCount,
        girlsCount,
        transferredCount,
        passedOutCount,
        avgAttendance,
        feePendingCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single student profile with full invoices, attendance, and activity logs
export const getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).populate("academicYear", "name");
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    // Security check for Parent role
    if (req.user.role === "PARENT" && 
        student.fatherEmail !== req.user.email && 
        student.motherEmail !== req.user.email &&
        student.fatherMobile !== req.user.mobile) {
      return res.status(403).json({
        success: false,
        message: "Access Denied. You can only view your own child's profile.",
      });
    }

    // Enquiries data
    const invoices = await Invoice.find({ student: id }).sort({ createdAt: -1 });
    const attendanceLogs = await StudentAttendanceLog.find({ student: id }).sort({ date: -1 });
    const activityLogs = await StudentActivityLog.find({ student: id })
      .populate("performedBy", "fullName role")
      .sort({ timestamp: -1 });
    
    const examResults = await ExamResult.find({ student: id })
      .populate("academicYear", "name")
      .sort({ createdAt: -1 });

    // Calculate attendance summary
    const totalWorking = attendanceLogs.length;
    const present = attendanceLogs.filter((l) => l.status === "Present").length;
    const absent = attendanceLogs.filter((l) => l.status === "Absent").length;
    const late = attendanceLogs.filter((l) => l.status === "Late").length;
    const attendancePercent = totalWorking > 0 ? Math.round(((present + late) / totalWorking) * 100) : 0;

    res.status(200).json({
      success: true,
      student,
      invoices,
      attendanceLogs,
      activityLogs,
      examResults,
      attendanceSummary: {
        totalWorking,
        present,
        absent,
        late,
        attendancePercent,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update student profile
export const updateStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    // Role verification
    if (req.user.role === "ACCOUNTANT") {
      // Accountant is blocked from updating academic details
      const academicKeys = ["className", "sectionName", "stream", "academicYear"];
      const containsAcademic = Object.keys(updateData).some((key) => academicKeys.includes(key));
      if (containsAcademic) {
        return res.status(403).json({
          success: false,
          message: "Accountant role is not authorized to edit academic configurations.",
        });
      }
    }

    // Aadhaar Uniqueness Check
    if (updateData.aadhaarNumber && updateData.aadhaarNumber !== student.aadhaarNumber) {
      const duplicateAadhaar = await Student.findOne({
        aadhaarNumber: updateData.aadhaarNumber,
        _id: { $ne: id },
      });
      if (duplicateAadhaar) {
        return res.status(400).json({
          success: false,
          message: "Aadhaar Number is already associated with another student.",
        });
      }
    }

    // Update Photo handler
    if (req.file) {
      updateData.photoUrl = `/uploads/${req.file.filename}`;
    }

    // Save changes
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    // Save activity audit log
    const log = new StudentActivityLog({
      student: id,
      action: "Profile Updated",
      performedBy: req.user._id,
      details: `Student profile fields updated by ${req.user.fullName}.`,
    });
    await log.save();

    res.status(200).json({
      success: true,
      message: "Student profile updated successfully.",
      data: updatedStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Handle Student Transfer (Class change, Section change, School Leaving TC)
export const transferStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { transferType, toClass, toSection, reason, remarks, transferDate } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    const prevClass = student.className;
    const prevSection = student.sectionName;
    const actualTransferDate = transferDate || new Date();

    const historyRecord = {
      transferDate: actualTransferDate,
      transferType,
      fromClass: prevClass,
      fromSection: prevSection,
      toClass: transferType === "Internal Transfer (Section Change)" ? prevClass : (toClass || prevClass),
      toSection: toSection || prevSection,
      reason,
      remarks: remarks || "",
      processedBy: req.user._id,
    };

    student.transferHistory.push(historyRecord);

    if (transferType === "Internal Transfer (Section Change)") {
      student.sectionName = toSection;
    } else if (transferType === "Internal Transfer (Class Change)") {
      student.className = toClass;
      student.sectionName = toSection;
    } else if (transferType === "School Leaving Transfer") {
      student.status = "Transferred";

      // Issue Transfer Certificate
      const tcCount = await TransferCertificate.countDocuments();
      const tcNumber = `TC-${new Date().getFullYear()}-${String(tcCount + 1).padStart(4, "0")}`;
      
      const tc = new TransferCertificate({
        tcNumber,
        student: student._id,
        issueDate: actualTransferDate,
        reason: reason || "Transfer",
        conduct: "Good",
        academicSummary: `Completed up to class ${prevClass}`,
        remarks: remarks || "",
        issuedBy: req.user._id,
      });
      await tc.save();
    }

    await student.save();

    // Log Activity
    const activity = new StudentActivityLog({
      student: student._id,
      action: "Transfer Generated",
      performedBy: req.user._id,
      details: `${transferType} completed. Reason: ${reason}.`,
    });
    await activity.save();

    res.status(200).json({
      success: true,
      message: `${transferType} processed successfully.`,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Student (Hard Delete with dependency checks)
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found.",
      });
    }

    // Enforce role: Teacher/Staff cannot delete students
    if (req.user.role === "STAFF") {
      return res.status(403).json({
        success: false,
        message: "Teachers are not authorized to delete student records.",
      });
    }

    // Check dependency record existence
    const invoiceCount = await Invoice.countDocuments({ student: id });
    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Dependency Error: Student cannot be deleted. Active billing invoices exist.",
      });
    }

    const examCount = await ExamResult.countDocuments({ student: id });
    if (examCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Dependency Error: Student cannot be deleted. Academic examination marks exist.",
      });
    }

    // Remove Student Activity logs, Attendance records, and User Login
    await StudentActivityLog.deleteMany({ student: id });
    await StudentAttendanceLog.deleteMany({ student: id });
    await TransferCertificate.deleteMany({ student: id });
    
    // Remove login credentials from User collection
    await User.findOneAndDelete({ admissionNo: student.admissionNo });

    // Delete student
    await Student.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Student profile and linked credentials deleted permanently.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
