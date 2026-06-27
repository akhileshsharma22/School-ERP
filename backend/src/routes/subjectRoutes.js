import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from "../controllers/subjectController.js";

const router = express.Router();

router.get("/", protect, getSubjects);

router.post("/", protect, authorize("ADMIN"), createSubject);

router.put("/:id", protect, authorize("ADMIN"), updateSubject);

router.delete("/:id", protect, authorize("ADMIN"), deleteSubject);

export default router;
