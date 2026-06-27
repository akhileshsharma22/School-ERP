import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { login, getMe, updateProfile, changePassword } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

// Ensure uploads folder exists
const uploadDir = "./public/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const router = express.Router();

router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/profile", protect, upload.single("photo"), updateProfile);
router.post("/change-password", protect, changePassword);

export default router;