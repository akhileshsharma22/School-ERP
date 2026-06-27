import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

import {
  createExamType,
  deleteExamType,
  getExamTypes,
  updateExamType,
} from "../controllers/examTypeController.js";

const router = express.Router();

router.get("/", protect, getExamTypes);

router.post("/", protect, authorize("ADMIN"), createExamType);

router.put("/:id", protect, authorize("ADMIN"), updateExamType);

router.delete("/:id", protect, authorize("ADMIN"), deleteExamType);

export default router;
