import express from "express";

import {
  createExamType,
  deleteExamType,
  getExamTypes,
  updateExamType,
} from "../controllers/examTypeController.js";

const router = express.Router();

router.get("/", getExamTypes);

router.post("/", createExamType);

router.put("/:id", updateExamType);

router.delete("/:id", deleteExamType);

export default router;
