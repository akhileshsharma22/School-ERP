import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  checkSetupDependencies,
  getStaff,
  getStaffProfile,
  createStaff,
  updateStaffProfile,
  deleteStaff,
  getStaffAttendance,
  markStaffAttendance,
  getStaffLeaves,
  createLeaveRequest,
  updateLeaveStatus,
  getStaffPayroll,
  generatePayroll,
  getStaffDocuments,
  uploadStaffDocument,
  deleteStaffDocument,
  replaceStaffDocument,
  getStaffActivityLogs,
  getAllLeaveRequests,
  getAllStaffAttendance,
  bulkMarkAttendance,
  getAllPayroll,
} from "../controllers/staffController.js";
import { protect } from "../middlewares/authMiddleware.js";

// Ensure uploads folder exists
const uploadDir = "./public/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter to allow image/pdf/doc types
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".pdf", ".doc", ".docx", ".xls", ".xlsx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("File format not supported. Supported: JPG, JPEG, PNG, PDF, DOC, DOCX, XLS, XLSX"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max size
});

const router = express.Router();

// Setup dependency validation
router.get("/setup-check", protect, checkSetupDependencies);

// System-wide query/bulk routes (must be placed BEFORE parameter routes)
router.get("/leaves/all", protect, getAllLeaveRequests);
router.get("/attendance/all", protect, getAllStaffAttendance);
router.post("/attendance/bulk", protect, bulkMarkAttendance);
router.get("/payroll/all", protect, getAllPayroll);

// Main Staff CRUD routes
router.get("/", protect, getStaff);
router.post("/", protect, upload.single("photo"), createStaff);
router.get("/:id", protect, getStaffProfile);
router.put("/:id", protect, upload.single("photo"), updateStaffProfile);
router.delete("/:id", protect, deleteStaff);

// Attendance routes
router.get("/:id/attendance", protect, getStaffAttendance);
router.post("/:id/attendance", protect, markStaffAttendance);

// Leaves routes
router.get("/:id/leaves", protect, getStaffLeaves);
router.post("/:id/leaves", protect, createLeaveRequest);
router.put("/:id/leaves/:leaveId", protect, updateLeaveStatus);

// Payroll routes
router.get("/:id/payroll", protect, getStaffPayroll);
router.post("/:id/payroll", protect, generatePayroll);

// Document routes
router.get("/:id/documents", protect, getStaffDocuments);
router.post("/:id/documents", protect, upload.single("file"), uploadStaffDocument);
router.put("/:id/documents/:docId", protect, upload.single("file"), replaceStaffDocument);
router.delete("/:id/documents/:docId", protect, deleteStaffDocument);

// Activity Log routes
router.get("/:id/activity-logs", protect, getStaffActivityLogs);

export default router;
