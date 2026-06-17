import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import Admission from "../models/Admission.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import Invoice from "../models/Invoice.js";
import Enquiry from "../models/Enquiry.js";
import AcademicYear from "../models/AcademicYear.js";
import ClassSection from "../models/ClassSection.js";
import Category from "../models/Category.js";
import Stream from "../models/Stream.js";
import StudentActivityLog from "../models/StudentActivityLog.js";
import StudentFeeAssignment from "../models/StudentFeeAssignment.js";
import { assignFeesToStudent } from "../services/financeService.js";

// Check setup dependencies
export const checkSetupDependencies = async (req, res) => {
  try {
    const hasAcademicYear = (await AcademicYear.countDocuments()) > 0;
    const hasClassSection = (await ClassSection.countDocuments({ status: "Active" })) > 0;
    const hasCategory = (await Category.countDocuments()) > 0;
    const hasStream = (await Stream.countDocuments({ status: "Active" })) > 0;

    res.status(200).json({
      success: true,
      data: {
        hasAcademicYear,
        hasClassSection,
        hasCategory,
        hasStream,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all admissions with filters and metrics
export const getAdmissions = async (req, res) => {
  try {
    const { search, className, verificationStatus, approvalStatus, academicYearId } = req.query;

    let query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { fatherName: { $regex: search, $options: "i" } },
        { aadhaarNumber: { $regex: search, $options: "i" } },
        { admissionNo: { $regex: search, $options: "i" } },
      ];
    }

    if (className) {
      query.classApplied = className;
    }

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }

    if (academicYearId) {
      query.academicYear = academicYearId;
    } else {
      const currentYear = await AcademicYear.findOne({ isCurrent: true });
      if (currentYear) {
        query.academicYear = currentYear._id;
      }
    }

    const admissions = await Admission.find(query)
      .populate("academicYear", "name")
      .sort({ createdAt: -1 });

    // Calculate metrics
    const totalCount = await Admission.countDocuments(query.academicYear ? { academicYear: query.academicYear } : {});
    const pendingVerification = await Admission.countDocuments({
      verificationStatus: "Pending",
      ...(query.academicYear ? { academicYear: query.academicYear } : {}),
    });
    const approvedCount = await Admission.countDocuments({
      approvalStatus: "Approved",
      ...(query.academicYear ? { academicYear: query.academicYear } : {}),
    });
    const rejectedCount = await Admission.countDocuments({
      $or: [{ approvalStatus: "Rejected" }, { verificationStatus: "Rejected" }],
      ...(query.academicYear ? { academicYear: query.academicYear } : {}),
    });

    // Today's enquiries count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const todayEnquiries = await Enquiry.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    res.status(200).json({
      success: true,
      data: admissions,
      metrics: {
        totalCount,
        pendingVerification,
        approvedCount,
        rejectedCount,
        todayEnquiries,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new Admission application
export const createAdmission = async (req, res) => {
  try {
    const admissionData = req.body;

    // Check dependency checklist
    const currentYear = await AcademicYear.findOne({ isCurrent: true });
    if (!currentYear) {
      return res.status(400).json({
        success: false,
        message: "Academic Year is missing. Please complete Master Setup first.",
      });
    }

    // Stream requirement check for 11 & 12
    if (
      ["Class 11", "Class 12"].includes(admissionData.classApplied) &&
      !admissionData.streamApplied
    ) {
      return res.status(400).json({
        success: false,
        message: "Stream selection is required for Class 11 and Class 12.",
      });
    }

    // Duplicate Aadhaar Check
    if (admissionData.aadhaarNumber) {
      const existingAadhaar = await Admission.findOne({
        aadhaarNumber: admissionData.aadhaarNumber,
        academicYear: currentYear._id,
      });
      if (existingAadhaar) {
        return res.status(400).json({
          success: false,
          message: "An admission application with this Aadhaar Number already exists for this academic year.",
        });
      }
    }

    // Create admission object
    const newAdmission = new Admission({
      ...admissionData,
      academicYear: currentYear._id,
      verificationStatus: "Pending",
      approvalStatus: "Pending",
    });

    await newAdmission.save();

    res.status(201).json({
      success: true,
      message: "Admission application submitted successfully.",
      data: newAdmission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Handle document uploads
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or invalid file format.",
      });
    }

    // Format file url
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      fileUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify admission documents
export const verifyAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { documents, verificationStatus, verificationRemarks, verifierName } = req.body;

    const admission = await Admission.findById(id);
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: "Admission application not found.",
      });
    }

    // Update document checklist status
    if (documents) {
      admission.documents = documents;
    }

    admission.verificationStatus = verificationStatus;
    admission.verificationRemarks = verificationRemarks || "";
    admission.verifierName = verifierName || "Verification Officer";
    admission.verificationDate = new Date();

    await admission.save();

    res.status(200).json({
      success: true,
      message: `Application verification status updated to: ${verificationStatus}`,
      data: admission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve verified admission
export const approveAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { feeStructure, amount, dueDate } = req.body;

    const admission = await Admission.findById(id);
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: "Admission application not found.",
      });
    }

    if (admission.verificationStatus !== "Verified") {
      return res.status(400).json({
        success: false,
        message: "Only verified admission applications can be approved.",
      });
    }

    if (admission.approvalStatus === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Admission is already approved.",
      });
    }

    // Auto-generate Admission Number, Student ID, and Username
    const currentYear = new Date().getFullYear();
    const studentCount = await Student.countDocuments();
    const sequenceNum = String(studentCount + 1).padStart(4, "0");

    const admissionNo = `ADM-${currentYear}-${sequenceNum}`;
    const studentId = `STU-${currentYear}-${sequenceNum}`;
    
    const cleanFirstName = admission.firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const studentUsername = `stu_${cleanFirstName}_${sequenceNum}`;
    const parentUsername = `prnt_${cleanFirstName}_${sequenceNum}`;

    const defaultPassword = `ChangeMe@${sequenceNum}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 1. Create Student record
    const student = new Student({
      studentId,
      admissionNo,
      admissionId: admission._id,
      academicYear: admission.academicYear,
      firstName: admission.firstName,
      middleName: admission.middleName,
      lastName: admission.lastName,
      dateOfBirth: admission.dateOfBirth,
      gender: admission.gender,
      category: admission.category,
      aadhaarNumber: admission.aadhaarNumber,
      className: admission.classApplied,
      sectionName: admission.sectionApplied,
      stream: admission.streamApplied,
      fatherName: admission.fatherName,
      fatherMobile: admission.fatherMobile,
      fatherEmail: admission.fatherEmail,
      motherName: admission.motherName,
      motherMobile: admission.motherMobile,
      currentAddress: admission.currentAddress,
      status: "Active",
    });

    await student.save();

    // 2. Create Student User login
    const studentUser = new User({
      fullName: `${admission.firstName} ${admission.lastName}`,
      admissionNo: admissionNo,
      password: hashedPassword,
      role: "STUDENT",
      isActive: true,
    });
    await studentUser.save();

    // 3. Create Parent User login
    let parentUser = null;
    if (admission.fatherEmail) {
      parentUser = await User.findOne({ email: admission.fatherEmail });
    }
    if (!parentUser) {
      parentUser = new User({
        fullName: admission.fatherName,
        email: admission.fatherEmail || undefined,
        password: hashedPassword,
        role: "PARENT",
        isActive: true,
      });
      await parentUser.save();
    }

    // 4. Fee integration: Generate automated fee assignments or fallback to first generic invoice
    const assigned = await assignFeesToStudent(
      student._id,
      admission.academicYear,
      admission.classApplied,
      admission.category,
      admission.streamApplied,
      admission.sectionApplied
    );

    let finalFeeStructureName = feeStructure || "Standard Annual Fee Structure";
    if (assigned) {
      // Find structure details for storage in admission logs
      const savedAssignment = await StudentFeeAssignment.findOne({ student: student._id }).populate("feeStructure").lean();
      if (savedAssignment && savedAssignment.feeStructure) {
        finalFeeStructureName = savedAssignment.feeStructure.name;
      }
    } else {
      const invoiceNum = `INV-${currentYear}-${sequenceNum}`;
      const finalAmount = amount || 12000;
      const finalDueDate = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const invoice = new Invoice({
        invoiceNumber: invoiceNum,
        student: student._id,
        admission: admission._id,
        amount: finalAmount,
        dueDate: finalDueDate,
        status: "Unpaid",
        feeStructureName: finalFeeStructureName,
        payableAmount: finalAmount
      });
      await invoice.save();
    }

    // 5. Update Admission application details
    admission.admissionNo = admissionNo;
    admission.studentId = studentId;
    admission.approvalStatus = "Approved";
    admission.approvedBy = req.user ? req.user._id : null;
    admission.approvalDate = new Date();
    admission.feeStructure = finalFeeStructureName;
    admission.paymentStatus = "Unpaid";

    await admission.save();

    // 6. Create Student Activity Log
    const activityLog = new StudentActivityLog({
      student: student._id,
      action: "Admission Approved",
      performedBy: req.user ? req.user._id : studentUser._id,
      details: `Admission approved and student record created with Admission No: ${admissionNo}`,
    });
    await activityLog.save();

    res.status(200).json({
      success: true,
      message: "Admission application approved, credentials and invoice generated successfully.",
      data: {
        admissionNo,
        studentId,
        studentUsername,
        parentUsername,
        password: defaultPassword,
        invoiceNumber: invoiceNum,
        amount: finalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
