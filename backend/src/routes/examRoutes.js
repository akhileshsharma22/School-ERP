import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  setupCheck,
  getExams, getExamById, createExam, updateExam, updateExamStatus, deleteExam,
  getSchedule, createScheduleEntry, bulkGenerateSchedule, updateScheduleEntry, deleteScheduleEntry,
  getStudentsForMarks, getMarks, saveBulkMarks, clearMarks,
  getResultsSummary, getResults, computeResults, publishResult, bulkPublishResults,
  getGradeConfig, saveGradeConfig,
  getAnalyticsOverview, getTopStudents,
  getAuditLogs,
} from "../controllers/examController.js";

const router = express.Router();

router.use(protect);

// Setup check
router.get("/setup-check", setupCheck);

// Exam CRUD
router.get("/", getExams);
router.get("/:id", getExamById);
router.post("/", createExam);
router.post("/create", createExam);
router.patch("/:id", updateExam);
router.put("/:id", updateExam);
router.patch("/:id/status", updateExamStatus);
router.delete("/:id", deleteExam);

// Schedule
router.get("/schedule/list", getSchedule);
router.post("/schedule", createScheduleEntry);
router.post("/schedule/bulk", bulkGenerateSchedule);
router.patch("/schedule/:id", updateScheduleEntry);
router.delete("/schedule/:id", deleteScheduleEntry);

// Marks Entry
router.get("/marks/students", getStudentsForMarks);
router.get("/marks/list", getMarks);
router.post("/marks/bulk", saveBulkMarks);
router.delete("/marks/clear", clearMarks);

// Results
router.get("/results/summary", getResultsSummary);
router.get("/results/list", getResults);
router.post("/results/compute", computeResults);
router.patch("/results/:id/publish", publishResult);
router.post("/results/bulk-publish", bulkPublishResults);

// Grade Config
router.get("/grade-config", getGradeConfig);
router.post("/grade-config", saveGradeConfig);

// Analytics
router.get("/analytics/overview", getAnalyticsOverview);
router.get("/analytics/top-students", getTopStudents);

// Audit Logs
router.get("/audit-logs", getAuditLogs);

export default router;
