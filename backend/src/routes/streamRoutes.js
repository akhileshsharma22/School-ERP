import express from "express";

import {
  createStream,
  deleteStream,
  getStreams,
  updateStream,
} from "../controllers/streamController.js";

const router = express.Router();

router.get("/", getStreams);
router.post("/", createStream);
router.put("/:id", updateStream);
router.delete("/:id", deleteStream);

export default router;
