import express from "express";

import {
  createAcademicYear,
  getAcademicYears,
  getCurrentAcademicYear,
  setCurrentAcademicYear,
  deleteAcademicYear,
} from "../controllers/academicYearController.js";

const router = express.Router();

router.post(
  "/",
  createAcademicYear
);

router.get(
  "/",
  getAcademicYears
);

router.get(
  "/current",
  getCurrentAcademicYear
);

router.put(
  "/:id/current",
  setCurrentAcademicYear
);

router.delete(
  "/:id",
  deleteAcademicYear
);

export default router;