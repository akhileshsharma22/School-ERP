import express from "express";
import {
  checkAttendanceDependencies,
  getAttendanceDashboard,
  getStudentAttendanceList,
  markStudentAttendance,
  deleteStudentAttendance,
  getStaffAttendanceList,
  markStaffAttendance,
  deleteStaffAttendance,
  getAttendanceReports,
  getAttendanceAnalytics,
} from "../controllers/attendanceController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Dependency check
router.get("/setup-check", protect, checkAttendanceDependencies);

// Dashboard stats
router.get("/dashboard", protect, getAttendanceDashboard);

// Student marking
router.get("/students", protect, getStudentAttendanceList);
router.post("/students", protect, markStudentAttendance);
router.delete("/students", protect, deleteStudentAttendance);

// Staff marking
router.get("/staff", protect, getStaffAttendanceList);
router.post("/staff", protect, markStaffAttendance);
router.delete("/staff", protect, deleteStaffAttendance);

// Reporting & Graphs
router.get("/reports", protect, getAttendanceReports);
router.get("/analytics", protect, getAttendanceAnalytics);

export default router;
