import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

import {
  createStream,
  deleteStream,
  getStreams,
  updateStream,
} from "../controllers/streamController.js";

const router = express.Router();

router.get("/", protect, getStreams);
router.post("/", protect, authorize("ADMIN"), createStream);
router.put("/:id", protect, authorize("ADMIN"), updateStream);
router.delete("/:id", protect, authorize("ADMIN"), deleteStream);

export default router;
