import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

import {
  createAcademicYear,
  getAcademicYears,
  getCurrentAcademicYear,
  setCurrentAcademicYear,
  deleteAcademicYear,
} from "../controllers/academicYearController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getAcademicYears
);

router.get(
  "/current",
  protect,
  getCurrentAcademicYear
);

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  createAcademicYear
);

router.put(
  "/:id/current",
  protect,
  authorize("ADMIN"),
  setCurrentAcademicYear
);

router.delete(
  "/:id",
  protect,
  authorize("ADMIN"),
  deleteAcademicYear
);

export default router;