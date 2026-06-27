import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", protect, getCategories);

router.post("/", protect, authorize("ADMIN"), createCategory);

router.put("/:id", protect, authorize("ADMIN"), updateCategory);

router.delete("/:id", protect, authorize("ADMIN"), deleteCategory);

export default router;
