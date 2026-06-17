import mongoose from "mongoose";
import fs from "fs";
import path from "path";

import Staff from "../models/Staff.js";
import StaffDocument from "../models/StaffDocument.js";
import StaffAttendance from "../models/StaffAttendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Payroll from "../models/Payroll.js";
import StaffActivityLog from "../models/StaffActivityLog.js";

import AcademicYear from "../models/AcademicYear.js";
import Department from "../models/Department.js";
import Designation from "../models/Designation.js";

// Helper to log staff actions
const logActivity = async (staffId, action, userId, details = "") => {
  try {
    await StaffActivityLog.create({
      staff: staffId,
      action,
      performedBy: userId,
      details,
    });
  } catch (error) {
    console.error("Error logging staff activity:", error.message);
  }
};

// 1. Dependency Validation Checks
export const checkSetupDependencies = async (req, res) => {
  try {
    const hasAcademicYear = (await AcademicYear.countDocuments()) > 0;
    const hasDepartment = (await Department.countDocuments()) > 0;
    const hasDesignation = (await Designation.countDocuments()) > 0;

    return res.status(200).json({
      success: true,
      data: {
        hasAcademicYear,
        hasDepartment,
        hasDesignation,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Staff CRUD

// Get all staff with filtering and metrics
export const getStaff = async (req, res) => {
  try {
    const {
      search,
      departmentId,
      designationId,
      staffType,
      employmentType,
      status,
    } = req.query;

    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { employeeId: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
      ];
    }

    if (departmentId) query.department = departmentId;
    if (designationId) query.designation = designationId;
    if (staffType) query.staffType = staffType;
    if (employmentType) query.employmentType = employmentType;
    if (status) query.status = status;

    const staffList = await Staff.find(query)
      .populate("department", "departmentName departmentCode")
      .populate("designation", "designationName designationCode")
      .sort({ createdAt: -1 });

    // Calculate HRMS dashboard metrics
    const totalStaff = await Staff.countDocuments();
    const teachingStaff = await Staff.countDocuments({ staffType: "Teaching Staff" });
    const nonTeachingStaff = await Staff.countDocuments({ staffType: "Non Teaching Staff" });
    const activeStaff = await Staff.countDocuments({ status: "Active" });
    const onLeave = await Staff.countDocuments({ status: "On Leave" });

    // New joinees in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newJoinees = await Staff.countDocuments({
      dateOfJoining: { $gte: thirtyDaysAgo },
    });

    return res.status(200).json({
      success: true,
      data: staffList,
      metrics: {
        totalStaff,
        teachingStaff,
        nonTeachingStaff,
        activeStaff,
        onLeave,
        newJoinees,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single staff profile details
export const getStaffProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee id",
      });
    }

    const employee = await Staff.findById(id)
      .populate("department", "departmentName departmentCode")
      .populate("designation", "designationName designationCode");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add new staff member
export const createStaff = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      bloodGroup,
      nationality,
      maritalStatus,
      mobile,
      alternateMobile,
      email,
      address,
      city,
      state,
      country,
      pincode,
      staffType,
      department,
      designation,
      qualification,
      experience,
      dateOfJoining,
      employmentType,
      salary,
      reportingManager,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !gender ||
      !dateOfBirth ||
      !mobile ||
      !email ||
      !address ||
      !city ||
      !state ||
      !pincode ||
      !staffType ||
      !department ||
      !designation ||
      !dateOfJoining ||
      !employmentType ||
      !salary
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Uniqueness Checks
    const emailExists = await Staff.findOne({ email: email.trim() });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email is already associated with another employee",
      });
    }

    const mobileExists = await Staff.findOne({ mobile: mobile.trim() });
    if (mobileExists) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is already associated with another employee",
      });
    }

    // Auto-generate unique Employee ID: EMP-YYYY-NNNN
    const currentYear = new Date().getFullYear();
    const count = await Staff.countDocuments({
      createdAt: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      },
    });
    const employeeId = `EMP-${currentYear}-${String(count + 1).padStart(4, "0")}`;

    let photoUrl = "";
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const newStaff = await Staff.create({
      employeeId,
      firstName: firstName.trim(),
      middleName: (middleName || "").trim(),
      lastName: lastName.trim(),
      gender,
      dateOfBirth,
      bloodGroup,
      nationality: nationality || "Indian",
      maritalStatus,
      photoUrl,
      mobile: mobile.trim(),
      alternateMobile: (alternateMobile || "").trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country || "India",
      pincode: pincode.trim(),
      staffType,
      department,
      designation,
      qualification: (qualification || "").trim(),
      experience: (experience || "").trim(),
      dateOfJoining,
      employmentType,
      salary,
      reportingManager: (reportingManager || "").trim(),
      status: "Active",
    });

    // Audit Log
    await logActivity(
      newStaff._id,
      "Staff Created",
      req.user._id,
      `Employee file created for ${firstName} ${lastName} (${employeeId}).`
    );

    return res.status(201).json({
      success: true,
      message: "Staff added successfully",
      data: newStaff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update staff member profile
export const updateStaffProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee id",
      });
    }

    const employee = await Staff.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    const updateData = { ...req.body };

    // Validate email / mobile uniqueness if changing
    if (updateData.email && updateData.email !== employee.email) {
      const emailExists = await Staff.findOne({ email: updateData.email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email is already associated with another employee",
        });
      }
    }

    if (updateData.mobile && updateData.mobile !== employee.mobile) {
      const mobileExists = await Staff.findOne({ mobile: updateData.mobile });
      if (mobileExists) {
        return res.status(400).json({
          success: false,
          message: "Mobile number is already associated with another employee",
        });
      }
    }

    if (req.file) {
      updateData.photoUrl = `/uploads/${req.file.filename}`;
    }

    // Save previous status to check if it changed
    const prevStatus = employee.status;

    const updatedStaff = await Staff.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    // Audit logs for updates and status changes
    await logActivity(
      id,
      "Profile Updated",
      req.user._id,
      `Employee profile updated by ${req.user.fullName}.`
    );

    if (updateData.status && updateData.status !== prevStatus) {
      await logActivity(
        id,
        "Status Changed",
        req.user._id,
        `Status adjusted from ${prevStatus} to ${updateData.status}.`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedStaff,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Hard Delete staff with dependencies checks
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee id",
      });
    }

    const employee = await Staff.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    // Dependency validations:
    const attendanceCount = await StaffAttendance.countDocuments({ staff: id });
    const leaveCount = await LeaveRequest.countDocuments({ staff: id });
    const payrollCount = await Payroll.countDocuments({ staff: id });
    const logCount = await StaffActivityLog.countDocuments({
      staff: id,
      action: { $ne: "Staff Created" },
    });

    if (attendanceCount > 0 || leaveCount > 0 || payrollCount > 0 || logCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete because dependent records exist.",
      });
    }

    // Safe deletion: Clean up docs and logs
    await StaffDocument.deleteMany({ staff: id });
    await StaffActivityLog.deleteMany({ staff: id });
    await Staff.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Staff profile deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Staff Attendance Controllers
export const getStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query; // e.g. 2026, 6

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Year and Month queries are required.",
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const logs = await StaffAttendance.find({
      staff: id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    const presentDays = await StaffAttendance.countDocuments({ staff: id, date: { $gte: startDate, $lte: endDate }, status: "Present" });
    const absentDays = await StaffAttendance.countDocuments({ staff: id, date: { $gte: startDate, $lte: endDate }, status: "Absent" });
    const lateEntries = await StaffAttendance.countDocuments({ staff: id, date: { $gte: startDate, $lte: endDate }, status: "Late" });
    const halfDays = await StaffAttendance.countDocuments({ staff: id, date: { $gte: startDate, $lte: endDate }, status: "Half Day" });
    const holidays = await StaffAttendance.countDocuments({ staff: id, date: { $gte: startDate, $lte: endDate }, status: "Holiday" });

    const totalWorking = presentDays + absentDays + lateEntries + halfDays;
    const attendancePercent = totalWorking > 0
      ? Math.round(((presentDays + lateEntries + (halfDays * 0.5)) / totalWorking) * 100)
      : 100;

    return res.status(200).json({
      success: true,
      logs,
      summary: {
        presentDays,
        absentDays,
        lateEntries,
        halfDays,
        holidays,
        attendancePercent,
      },
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
    const { id } = req.params;
    const { date, status, remarks } = req.body;

    if (!date || !status) {
      return res.status(400).json({
        success: false,
        message: "Date and Status are required.",
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0); // standard daily date index

    const updatedAttendance = await StaffAttendance.findOneAndUpdate(
      { staff: id, date: attendanceDate },
      { $set: { status, remarks: remarks || "" } },
      { new: true, upsert: true }
    );

    // Audit logs
    await logActivity(
      id,
      "Attendance Updated",
      req.user._id,
      `Attendance marked: ${status} on ${attendanceDate.toLocaleDateString()}.`
    );

    return res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: updatedAttendance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Leave Management Controllers
export const getStaffLeaves = async (req, res) => {
  try {
    const { id } = req.params;

    const leaves = await LeaveRequest.find({ staff: id })
      .populate("approvedBy", "fullName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      leaves,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields for leave request.",
      });
    }

    const newRequest = await LeaveRequest.create({
      staff: id,
      leaveType,
      startDate,
      endDate,
      reason,
      status: "Pending",
    });

    await logActivity(
      id,
      "Leave Requested",
      req.user._id,
      `Requested ${leaveType} leave starting ${new Date(startDate).toLocaleDateString()}.`
    );

    return res.status(201).json({
      success: true,
      message: "Leave request submitted",
      data: newRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id, leaveId } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Leave status is required.",
      });
    }

    const request = await LeaveRequest.findById(leaveId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found.",
      });
    }

    request.status = status;
    request.remarks = remarks || "";
    request.approvedBy = req.user._id;
    await request.save();

    // Audit logs
    const auditAction = status === "Approved" ? "Leave Approved" : "Leave Rejected";
    await logActivity(
      id,
      auditAction,
      req.user._id,
      `Leave request status changed to ${status}. Remarks: ${remarks || "None"}.`
    );

    // If leave approved, update Staff status automatically to 'On Leave'
    if (status === "Approved") {
      await Staff.findByIdAndUpdate(id, { $set: { status: "On Leave" } });
    }

    return res.status(200).json({
      success: true,
      message: status === "Approved" ? "Leave approved" : "Leave request status updated",
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. Payroll Controllers
export const getStaffPayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const payrolls = await Payroll.find({ staff: id }).sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const generatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year, allowances, deductions } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and Year are required.",
      });
    }

    const employee = await Staff.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const basicPay = employee.salary;
    const allowanceVal = Number(allowances || 0);
    const deductionVal = Number(deductions || 0);

    // net salary calculation formulas (PF: 12%, ESI: 1.75%, Tax: 10% on basic)
    const pf = Math.round(basicPay * 0.12);
    const esi = Math.round(basicPay * 0.0175);
    const tax = Math.round(basicPay * 0.10);

    const netSalary = basicPay + allowanceVal - deductionVal - pf - esi - tax;

    // Create or update payslip
    const payslip = await Payroll.findOneAndUpdate(
      { staff: id, month, year },
      {
        $set: {
          basicPay,
          allowances: allowanceVal,
          deductions: deductionVal,
          pf,
          esi,
          tax,
          netSalary,
          status: "Paid",
          paidAt: new Date(),
          payslipUrl: `/uploads/payslip-${id}-${month}-${year}.pdf`,
        },
      },
      { new: true, upsert: true }
    );

    await logActivity(
      id,
      "Salary Generated",
      req.user._id,
      `Salary slip generated for ${month}/${year}. Net: ₹${netSalary}.`
    );

    return res.status(200).json({
      success: true,
      message: "Payroll generated",
      data: payslip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. Document Management Controllers
export const getStaffDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    const documents = await StaffDocument.find({ staff: id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      documents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const uploadStaffDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { docType } = req.body;

    if (!docType || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Document Type and File are required.",
      });
    }

    const docRecord = await StaffDocument.create({
      staff: id,
      docType,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
    });

    await logActivity(
      id,
      "Documents Uploaded",
      req.user._id,
      `Uploaded file: ${req.file.originalname} for ${docType}.`
    );

    return res.status(201).json({
      success: true,
      message: "Document uploaded",
      data: docRecord,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteStaffDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;

    const doc = await StaffDocument.findById(docId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    // Try deleting physical file
    const filePath = path.join("./public", doc.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await StaffDocument.findByIdAndDelete(docId);

    await logActivity(
      id,
      "Documents Uploaded",
      req.user._id,
      `Deleted document record: ${doc.fileName}.`
    );

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const replaceStaffDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Replacement file is required.",
      });
    }

    const doc = await StaffDocument.findById(docId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    // Unlink old file
    const oldFilePath = path.join("./public", doc.fileUrl);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    doc.fileName = req.file.originalname;
    doc.fileUrl = `/uploads/${req.file.filename}`;
    await doc.save();

    await logActivity(
      id,
      "Documents Uploaded",
      req.user._id,
      `Replaced file of ${doc.docType} with ${req.file.originalname}.`
    );

    return res.status(200).json({
      success: true,
      message: "Document replaced successfully",
      data: doc,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 7. Activity Log Controllers
export const getStaffActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const logs = await StaffActivityLog.find({ staff: id })
      .populate("performedBy", "fullName role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 8. Bulk & System-Wide HRMS Controllers
export const getAllLeaveRequests = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find()
      .populate("staff", "firstName lastName employeeId department designation status photoUrl mobile email")
      .populate("approvedBy", "fullName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllStaffAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required.",
      });
    }

    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    const logs = await StaffAttendance.find({ date: searchDate });
    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const bulkMarkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{ staffId, status, remarks }]
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "Date and records array are required.",
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const operations = records.map((rec) => ({
      updateOne: {
        filter: { staff: rec.staffId, date: attendanceDate },
        update: { $set: { status: rec.status, remarks: rec.remarks || "" } },
        upsert: true,
      },
    }));

    await StaffAttendance.bulkWrite(operations);

    // Audit logs for bulk action
    for (const rec of records) {
      await logActivity(
        rec.staffId,
        "Attendance Updated",
        req.user._id,
        `Attendance marked: ${rec.status} via Bulk Register on ${attendanceDate.toLocaleDateString()}.`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Bulk attendance marked successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllPayroll = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = {};
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);

    const payrolls = await Payroll.find(query)
      .populate("staff", "firstName lastName employeeId department designation status photoUrl salary")
      .sort({ year: -1, month: -1 });

    return res.status(200).json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
