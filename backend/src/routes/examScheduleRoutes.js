import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getSchedules,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry
} from "../controllers/examScheduleController.js";

const router = express.Router();

router.use(protect);

router.get("/", getSchedules);
router.post("/", createScheduleEntry);
router.put("/:id", updateScheduleEntry);
router.patch("/:id", updateScheduleEntry);
router.delete("/:id", deleteScheduleEntry);

export default router;
