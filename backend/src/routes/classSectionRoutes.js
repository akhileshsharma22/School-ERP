import express from "express";

import {
  createClassSection,
  deleteClassSection,
  getClassSections,
  updateClassSection,
} from "../controllers/classSectionController.js";

const router = express.Router();

router.get("/", getClassSections);

router.post("/", createClassSection);

router.put("/:id", updateClassSection);

router.delete("/:id", deleteClassSection);

export default router;
