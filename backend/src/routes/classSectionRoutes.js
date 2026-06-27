import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

import {
  createClassSection,
  deleteClassSection,
  getClassSections,
  updateClassSection,
} from "../controllers/classSectionController.js";

const router = express.Router();

router.get("/", protect, getClassSections);

router.post("/", protect, authorize("ADMIN"), createClassSection);

router.put("/:id", protect, authorize("ADMIN"), updateClassSection);

router.delete("/:id", protect, authorize("ADMIN"), deleteClassSection);

export default router;
