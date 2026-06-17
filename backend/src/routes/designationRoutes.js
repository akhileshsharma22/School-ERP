import express from "express";

import {
  createDesignation,
  deleteDesignation,
  getDesignations,
  updateDesignation,
} from "../controllers/designationController.js";

const router = express.Router();

router.get("/", getDesignations);

router.post("/", createDesignation);

router.put("/:id", updateDesignation);

router.delete("/:id", deleteDesignation);

export default router;
