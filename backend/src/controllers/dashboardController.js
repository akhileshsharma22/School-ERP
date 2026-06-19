import mongoose from "mongoose";
import Student from "../models/Student.js";
import Admission from "../models/Admission.js";
import Enquiry from "../models/Enquiry.js";
import Staff from "../models/Staff.js";
import StudentAttendance from "../models/StudentAttendance.js";
import StaffAttendance from "../models/StaffAttendance.js";
import Exam from "../models/Exam.js";
import ExamResultSummary from "../models/ExamResultSummary.js";
import StudentFeeAssignment from "../models/StudentFeeAssignment.js";
import FeeReceipt from "../models/FeeReceipt.js";
import AcademicYear from "../models/AcademicYear.js";
import ClassSection from "../models/ClassSection.js";
import Stream from "../models/Stream.js";
import Subject from "../models/Subject.js";
import Department from "../models/Department.js";
import Invoice from "../models/Invoice.js";

// Helper to calculate percentages safely
const safePercentage = (numerator, denominator) => {
  if (!denominator || denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
};

export const getDashboardSummary = async (req, res) => {
  try {
    // 1. Resolve Academic Year
    let { academicYear } = req.query;
    if (!academicYear || academicYear === "undefined" || academicYear === "null") {
      const activeAY = await AcademicYear.findOne({ isCurrent: true }) ||
                       await AcademicYear.findOne({ isActive: true }) ||
                       await AcademicYear.findOne().sort({ startDate: -1 });
      academicYear = activeAY ? activeAY._id.toString() : null;
    }

    if (!academicYear) {
      return res.status(200).json({
        success: true,
        message: "No Academic Year configured.",
        summary: null
      });
    }

    const ayObjectId = new mongoose.Types.ObjectId(academicYear);
    const ayDoc = await AcademicYear.findById(ayObjectId);

    // Resolve date bounds for current month and academic year
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfToday = new Date(today);

    const ayStart = ayDoc ? new Date(ayDoc.startDate) : new Date(today.getFullYear(), 0, 1);
    const ayEnd = ayDoc ? new Date(ayDoc.endDate) : new Date(today.getFullYear(), 11, 31);

    // 2. Fetch Base Counts (KPI Cards / Overviews)
    const totalStudents = await Student.countDocuments({ academicYear: ayObjectId, status: "Active" });
    const newAdmissions = await Admission.countDocuments({ academicYear: ayObjectId, approvalStatus: "Approved" });
    const totalStaff = await Staff.countDocuments({ status: "Active" });
    const activeClassesCount = await ClassSection.countDocuments({ status: "Active" });
    const activeStreamsCount = await Stream.countDocuments({ status: "Active" });
    const activeSubjectsCount = await Subject.countDocuments();

    // Section count across classes
    const classes = await ClassSection.find({ status: "Active" });
    const totalSectionsCount = classes.reduce((sum, c) => sum + (c.sections?.length || 0), 0);

    // Exams counts
    const upcomingExams = await Exam.countDocuments({ academicYear: ayObjectId, status: { $in: ["Scheduled", "Active"] } });
    const totalExams = await Exam.countDocuments({ academicYear: ayObjectId });
    const scheduledExams = await Exam.countDocuments({ academicYear: ayObjectId, status: "Scheduled" });
    const completedExams = await Exam.countDocuments({ academicYear: ayObjectId, status: "Completed" });
    const resultsPublished = await Exam.countDocuments({ academicYear: ayObjectId, status: "Published" });

    // 3. Student & Staff Attendance Today
    const studentAttendanceLogs = await StudentAttendance.find({ academicYear: ayObjectId, date: startOfToday });
    let presentStudents = 0;
    let absentStudents = 0;
    let lateStudents = 0;
    let halfDayStudents = 0;

    studentAttendanceLogs.forEach(log => {
      if (log.status === "Present") presentStudents++;
      else if (log.status === "Absent") absentStudents++;
      else if (log.status === "Late") {
        presentStudents++;
        lateStudents++;
      } else if (log.status === "Half Day") {
        presentStudents += 0.5;
        halfDayStudents++;
      }
    });

    const studentAttendanceRateToday = safePercentage(presentStudents, totalStudents);

    const staffAttendanceLogs = await StaffAttendance.find({ date: startOfToday });
    let presentStaff = 0;
    let absentStaff = 0;

    staffAttendanceLogs.forEach(log => {
      if (log.status === "Present" || log.status === "Work From Home" || log.status === "Late") presentStaff++;
      else if (log.status === "Absent") absentStaff++;
    });

    const staffAttendanceRateToday = safePercentage(presentStaff, totalStaff);

    // 4. Finance & Fees Summaries
    const feeSummary = await StudentFeeAssignment.aggregate([
      { $match: { academicYear: ayObjectId } },
      {
        $group: {
          _id: null,
          totalExpected: { $sum: "$totalPayable" },
          totalPaid: { $sum: "$totalPaid" },
          totalDiscount: { $sum: "$totalDiscountAmount" }
        }
      }
    ]);

    const expectedCollection = feeSummary[0]?.totalExpected || 0;
    const collectedAmount = feeSummary[0]?.totalPaid || 0;
    const pendingAmount = Math.max(0, expectedCollection - collectedAmount);
    const collectionPercentage = safePercentage(collectedAmount, expectedCollection);
    const totalDiscountAmount = feeSummary[0]?.totalDiscount || 0;

    // Recent 5 payments
    // To filter by academic year, we can aggregate receipts and lookup invoices/students
    const recentCollections = await FeeReceipt.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      { $unwind: "$studentInfo" },
      { $match: { "studentInfo.academicYear": ayObjectId } },
      { $sort: { paymentDate: -1 } },
      { $limit: 5 },
      {
        $project: {
          receiptNumber: 1,
          amountPaid: 1,
          paymentMode: 1,
          paymentDate: 1,
          studentName: { $concat: ["$studentInfo.firstName", " ", "$studentInfo.lastName"] },
          studentClass: "$studentInfo.className",
          studentSection: "$studentInfo.sectionName",
          studentAdmissionNo: "$studentInfo.admissionNo"
        }
      }
    ]);

    // Monthly collection trend
    const monthlyCollections = await FeeReceipt.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "student",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      { $unwind: "$studentInfo" },
      {
        $match: {
          "studentInfo.academicYear": ayObjectId,
          paymentDate: { $gte: ayStart, $lte: ayEnd },
          status: "Success"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" }
          },
          collected: { $sum: "$amountPaid" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthlyCollectionTrend = monthlyCollections.map(mc => {
      const date = new Date(mc._id.year, mc._id.month - 1, 1);
      return {
        month: date.toLocaleString("en-IN", { month: "short" }),
        year: mc._id.year,
        collected: mc.collected
      };
    });

    // 5. Academic Details
    const classCounts = await Student.aggregate([
      { $match: { academicYear: ayObjectId, status: "Active" } },
      { $group: { _id: "$className", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const studentsPerClass = classCounts.map(cc => ({
      className: cc._id,
      count: cc.count
    }));

    // 6. Admission & Enquiry Analytics
    const totalEnquiries = await Enquiry.countDocuments({ academicYear: ayObjectId });
    const pendingEnquiries = await Enquiry.countDocuments({ academicYear: ayObjectId, status: { $in: ["New", "Follow Up"] } });
    const approvedAdmissions = await Admission.countDocuments({ academicYear: ayObjectId, approvalStatus: "Approved" });
    const rejectedAdmissions = await Admission.countDocuments({ academicYear: ayObjectId, approvalStatus: "Rejected" });
    const pendingAdmissions = await Admission.countDocuments({ academicYear: ayObjectId, approvalStatus: "Pending" });
    const currentMonthAdmissions = await Admission.countDocuments({
      academicYear: ayObjectId,
      createdAt: { $gte: startOfMonth }
    });
    const admissionConversionRate = safePercentage(approvedAdmissions, totalEnquiries);

    // 7. Student Breakdown (Gender, Category)
    const boysCount = await Student.countDocuments({ academicYear: ayObjectId, status: "Active", gender: "Male" });
    const girlsCount = await Student.countDocuments({ academicYear: ayObjectId, status: "Active", gender: "Female" });

    const categoryCounts = await Student.aggregate([
      { $match: { academicYear: ayObjectId, status: "Active" } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    // Ensure we represent all categories cleanly
    const categoriesList = ["General", "OBC", "SC", "ST", "EWS"];
    const categoryDistribution = categoriesList.map(cat => {
      const match = categoryCounts.find(cc => cc._id?.toLowerCase() === cat.toLowerCase());
      return {
        category: cat,
        count: match ? match.count : 0
      };
    });

    // 8. Staff Overview
    const teachingStaff = await Staff.countDocuments({ status: "Active", staffType: "Teaching Staff" });
    const nonTeachingStaff = await Staff.countDocuments({ status: "Active", staffType: "Non Teaching Staff" });

    const deptCounts = await Staff.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: "$department", count: { $sum: 1 } } }
    ]);
    const populatedDeptCounts = await Department.populate(deptCounts, { path: "_id", select: "departmentName" });
    const departmentDistribution = populatedDeptCounts.map(dc => ({
      departmentName: dc._id?.departmentName || "General / Administration",
      count: dc.count
    }));

    // 9. Attendance Trends & Class Attendance
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const dailyAttendanceTrend = await StudentAttendance.aggregate([
      {
        $match: {
          academicYear: ayObjectId,
          date: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: "$date",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ["$status", ["Present", "Late", "Half Day"]] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const studentAttendanceTrend = dailyAttendanceTrend.map(dat => ({
      date: new Date(dat._id).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      rate: safePercentage(dat.present, dat.total)
    }));

    const attendanceByClassLogs = await StudentAttendance.aggregate([
      { $match: { academicYear: ayObjectId, date: startOfToday } },
      {
        $group: {
          _id: "$class",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $in: ["$status", ["Present", "Late", "Half Day"]] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const attendanceByClass = attendanceByClassLogs.map(abc => ({
      className: abc._id,
      rate: safePercentage(abc.present, abc.total)
    }));

    // 10. Examination Analytics
    const examResults = await ExamResultSummary.find({ academicYear: ayObjectId });
    const totalResults = examResults.length;
    const passedResults = examResults.filter(r => r.resultStatus === "PASS").length;
    const overallPassRate = safePercentage(passedResults, totalResults);

    const classExamStats = await ExamResultSummary.aggregate([
      { $match: { academicYear: ayObjectId } },
      {
        $group: {
          _id: "$className",
          total: { $sum: 1 },
          passed: { $sum: { $cond: [{ $eq: ["$resultStatus", "PASS"] }, 1, 0] } }
        }
      }
    ]);

    const classWisePassRates = classExamStats.map(ces => ({
      className: ces._id,
      rate: safePercentage(ces.passed, ces.total)
    }));

    // Top & Lowest performing classes
    let topPerformingClass = "—";
    let lowestPerformingClass = "—";
    if (classWisePassRates.length > 0) {
      const sortedClasses = [...classWisePassRates].sort((a, b) => b.rate - a.rate);
      topPerformingClass = `${sortedClasses[0].className} (${sortedClasses[0].rate}%)`;
      lowestPerformingClass = `${sortedClasses[sortedClasses.length - 1].className} (${sortedClasses[sortedClasses.length - 1].rate}%)`;
    }

    // Assemble the single consolidated summary payload
    const dashboardSummary = {
      academicYear: {
        id: academicYear,
        name: ayDoc ? ayDoc.name : "Active Session"
      },
      kpis: {
        totalStudents,
        newAdmissions,
        totalStaff,
        studentAttendanceRateToday,
        feesCollected: collectedAmount,
        pendingFees: pendingAmount,
        activeClasses: activeClassesCount,
        upcomingExams
      },
      academicOverview: {
        activeClasses: activeClassesCount,
        activeSections: totalSectionsCount,
        activeStreams: activeStreamsCount,
        activeSubjects: activeSubjectsCount,
        studentsPerClass
      },
      admissionOverview: {
        totalEnquiries,
        pendingEnquiries,
        approvedAdmissions,
        rejectedAdmissions,
        pendingAdmissions,
        currentMonthAdmissions,
        admissionConversionRate
      },
      studentOverview: {
        totalStudents,
        boys: boysCount,
        girls: girlsCount,
        categoryDistribution
      },
      staffOverview: {
        totalStaff,
        teachingStaff,
        nonTeachingStaff,
        staffAttendanceRateToday,
        departmentDistribution
      },
      attendanceOverview: {
        attendanceRateToday: studentAttendanceRateToday,
        presentStudents,
        absentStudents,
        lateArrivals: lateStudents,
        studentAttendanceTrend,
        attendanceByClass
      },
      examinationOverview: {
        totalExams,
        scheduledExams,
        completedExams,
        resultsPublished,
        overallPassRate,
        classWisePassRates,
        topPerformingClass,
        lowestPerformingClass
      },
      financeOverview: {
        expectedCollection,
        collectedAmount,
        pendingAmount,
        collectionPercentage,
        totalDiscountAmount,
        recentCollections,
        monthlyCollectionTrend
      }
    };

    return res.status(200).json({
      success: true,
      data: dashboardSummary
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const searchDashboard = async (req, res) => {
  try {
    const { q, academicYear } = req.query;
    if (!q || q.trim() === "") {
      return res.status(200).json({
        success: true,
        results: { students: [], staff: [], admissions: [], finance: [], exams: [] }
      });
    }

    let ayObjectId = null;
    if (academicYear && academicYear !== "undefined" && academicYear !== "null") {
      ayObjectId = new mongoose.Types.ObjectId(academicYear);
    } else {
      const activeAY = await AcademicYear.findOne({ isCurrent: true }) ||
                       await AcademicYear.findOne({ isActive: true }) ||
                       await AcademicYear.findOne().sort({ startDate: -1 });
      ayObjectId = activeAY ? activeAY._id : null;
    }

    const regex = new RegExp(q.trim(), "i");

    // Parallel Queries for Instant Search
    const studentQuery = {
      $or: [
        { firstName: regex },
        { lastName: regex },
        { studentId: regex },
        { admissionNo: regex }
      ]
    };
    if (ayObjectId) studentQuery.academicYear = ayObjectId;

    const admissionQuery = {
      $or: [
        { firstName: regex },
        { lastName: regex },
        { studentId: regex },
        { admissionNo: regex }
      ]
    };
    if (ayObjectId) admissionQuery.academicYear = ayObjectId;

    const staffQuery = {
      $or: [
        { firstName: regex },
        { lastName: regex },
        { employeeId: regex },
        { email: regex }
      ],
      status: "Active"
    };

    const examQuery = { examName: regex };
    if (ayObjectId) examQuery.academicYear = ayObjectId;

    const [students, admissions, staff, exams, invoiceMatches] = await Promise.all([
      Student.find(studentQuery).limit(5).select("firstName lastName studentId admissionNo className sectionName"),
      Admission.find(admissionQuery).limit(5).select("firstName lastName studentId admissionNo classApplied approvalStatus"),
      Staff.find(staffQuery).limit(5).select("firstName lastName employeeId staffType"),
      Exam.find(examQuery).limit(5).select("examName startDate endDate status"),
      Invoice.find({
        $or: [
          { invoiceNumber: regex },
          { feeStructureName: regex }
        ]
      }).limit(5).populate("student", "firstName lastName").select("invoiceNumber payableAmount paidAmount status student")
    ]);

    const results = {
      students: students.map(s => ({
        id: s._id,
        title: `${s.firstName} ${s.lastName}`,
        subtitle: `Class: ${s.className}-${s.sectionName} · Adm No: ${s.admissionNo}`,
        route: `/students/all`
      })),
      admissions: admissions.map(a => ({
        id: a._id,
        title: `${a.firstName} ${a.lastName}`,
        subtitle: `Class Applied: ${a.classApplied} · Status: ${a.approvalStatus}`,
        route: `/admissions/applications`
      })),
      staff: staff.map(st => ({
        id: st._id,
        title: `${st.firstName} ${st.lastName}`,
        subtitle: `${st.staffType} · ID: ${st.employeeId}`,
        route: `/staff/all`
      })),
      exams: exams.map(e => ({
        id: e._id,
        title: e.examName,
        subtitle: `Exams · Date: ${new Date(e.startDate).toLocaleDateString()} · Status: ${e.status}`,
        route: `/exams/schedule`
      })),
      finance: invoiceMatches.map(inv => ({
        id: inv._id,
        title: `Bill ${inv.invoiceNumber}`,
        subtitle: `Student: ${inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : "—"} · Paid: ₹${inv.paidAmount}/₹${inv.payableAmount} (${inv.status})`,
        route: `/fees/collect`
      }))
    };

    return res.status(200).json({
      success: true,
      results
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
