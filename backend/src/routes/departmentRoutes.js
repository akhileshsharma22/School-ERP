import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

router.use(protect);
router.use(authorize("ADMIN"));

router.get("/", getDepartments);

router.post("/", createDepartment);

router.put("/:id", updateDepartment);

router.delete("/:id", deleteDepartment);

export default router;
