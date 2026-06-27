import express from "express";
import {
  getPromotionCandidates,
  promoteStudent,
  bulkPromoteStudents,
  getPromotionHistory,
} from "../controllers/promotionController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("ADMIN"));

router.get("/candidates", getPromotionCandidates);
router.post("/promote/:id", promoteStudent);
router.post("/bulk-promote", bulkPromoteStudents);
router.get("/history", getPromotionHistory);

export default router;
