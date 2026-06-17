import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getFeeCategories, createFeeCategory, updateFeeCategory, deleteFeeCategory,
  getDiscounts, createDiscount, updateDiscount, deleteDiscount,
  getStructures, createStructure, updateStructure, deleteStructure,
  getAssignments, triggerStudentAssignment, bulkTriggerAssignments,
  getInvoices, getInvoiceById, applyConcession, collectPayment,
  getReceipts, refundReceipt,
  getDashboardMetrics, getFinanceAuditLogs
} from "../controllers/financeController.js";

const router = express.Router();

router.use(protect);

// Fee Categories
router.get("/fee-categories", getFeeCategories);
router.post("/fee-categories", createFeeCategory);
router.put("/fee-categories/:id", updateFeeCategory);
router.delete("/fee-categories/:id", deleteFeeCategory);

// Discounts
router.get("/discounts", getDiscounts);
router.post("/discounts", createDiscount);
router.put("/discounts/:id", updateDiscount);
router.delete("/discounts/:id", deleteDiscount);

// Structures
router.get("/structures", getStructures);
router.post("/structures", createStructure);
router.put("/structures/:id", updateStructure);
router.delete("/structures/:id", deleteStructure);

// Student Assignments
router.get("/assignments", getAssignments);
router.post("/assignments/trigger", triggerStudentAssignment);
router.post("/assignments/bulk-trigger", bulkTriggerAssignments);

// Invoices
router.get("/invoices", getInvoices);
router.get("/invoices/:id", getInvoiceById);
router.post("/invoices/:id/concession", applyConcession);
router.post("/invoices/:id/collect", collectPayment);

// Receipts & Refunds
router.get("/receipts", getReceipts);
router.post("/receipts/:id/refund", refundReceipt);

// Dashboard & Metrics & Audits
router.get("/dashboard", getDashboardMetrics);
router.get("/audit-logs", getFinanceAuditLogs);

export default router;
