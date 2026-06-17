import express from "express";
import {
  getPromotionCandidates,
  promoteStudent,
  bulkPromoteStudents,
  getPromotionHistory,
} from "../controllers/promotionController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/candidates", protect, getPromotionCandidates);
router.post("/promote/:id", protect, promoteStudent);
router.post("/bulk-promote", protect, bulkPromoteStudents);
router.get("/history", protect, getPromotionHistory);

export default router;
