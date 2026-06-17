import express from "express";
import {
  getEnquiries,
  createEnquiry,
  updateEnquiry,
  convertEnquiry,
} from "../controllers/enquiryController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Enquiries routes
router.get("/", protect, getEnquiries);
router.post("/", protect, createEnquiry);
router.put("/:id", protect, updateEnquiry);
router.post("/:id/convert", protect, convertEnquiry);

export default router;
