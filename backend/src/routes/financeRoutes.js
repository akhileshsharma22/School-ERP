import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
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
router.get("/fee-categories", authorize("ADMIN"), getFeeCategories);
router.post("/fee-categories", authorize("ADMIN"), createFeeCategory);
router.put("/fee-categories/:id", authorize("ADMIN"), updateFeeCategory);
router.delete("/fee-categories/:id", authorize("ADMIN"), deleteFeeCategory);

// Discounts
router.get("/discounts", authorize("ADMIN"), getDiscounts);
router.post("/discounts", authorize("ADMIN"), createDiscount);
router.put("/discounts/:id", authorize("ADMIN"), updateDiscount);
router.delete("/discounts/:id", authorize("ADMIN"), deleteDiscount);

// Structures
router.get("/structures", authorize("ADMIN"), getStructures);
router.post("/structures", authorize("ADMIN"), createStructure);
router.put("/structures/:id", authorize("ADMIN"), updateStructure);
router.delete("/structures/:id", authorize("ADMIN"), deleteStructure);

// Student Assignments
router.get("/assignments", authorize("ADMIN"), getAssignments);
router.post("/assignments/trigger", authorize("ADMIN"), triggerStudentAssignment);
router.post("/assignments/bulk-trigger", authorize("ADMIN"), bulkTriggerAssignments);

// Invoices
router.get("/invoices", getInvoices);
router.get("/invoices/:id", getInvoiceById);
router.post("/invoices/:id/concession", authorize("ADMIN"), applyConcession);
router.post("/invoices/:id/collect", authorize("ADMIN"), collectPayment);

// Receipts & Refunds
router.get("/receipts", getReceipts);
router.post("/receipts/:id/refund", authorize("ADMIN"), refundReceipt);

// Dashboard & Metrics & Audits
router.get("/dashboard", authorize("ADMIN"), getDashboardMetrics);
router.get("/audit-logs", authorize("ADMIN"), getFinanceAuditLogs);

export default router;
