import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  getStudents,
  getStudentProfile,
  updateStudentProfile,
  transferStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

// Ensure uploads folder exists
const uploadDir = "./public/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer photo configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `photo-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".png", ".jpg", ".jpeg"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Allowed formats: PNG, JPG, JPEG only."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max size
});

const router = express.Router();

router.get("/", protect, getStudents);
router.get("/:id", protect, getStudentProfile);
router.put("/:id", protect, authorize("ADMIN"), upload.single("photo"), updateStudentProfile);
router.post("/:id/transfer", protect, authorize("ADMIN"), transferStudent);
router.delete("/:id", protect, authorize("ADMIN"), deleteStudent);

export default router;
