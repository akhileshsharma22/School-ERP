import express from "express";
import {
  getEnquiries,
  createEnquiry,
  updateEnquiry,
  convertEnquiry,
} from "../controllers/enquiryController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("ADMIN"));

// Enquiries routes
router.get("/", getEnquiries);
router.post("/", createEnquiry);
router.put("/:id", updateEnquiry);
router.post("/:id/convert", convertEnquiry);

export default router;
