import express from "express";
import { getDashboardSummary, searchDashboard } from "../controllers/dashboardController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getDashboardSummary);
router.get("/search", protect, searchDashboard);

export default router;
