import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  checkSetupDependencies,
  getAdmissions,
  createAdmission,
  uploadDocument,
  verifyAdmission,
  approveAdmission,
} from "../controllers/admissionController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

// Ensure upload path exists under the backend working dir
const uploadDir = "./public/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File validation logic
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB maximum size limit
});

const router = express.Router();

router.use(protect);
router.use(authorize("ADMIN"));

// Admissions routes
router.get("/setup-check", checkSetupDependencies);
router.get("/", getAdmissions);
router.post("/", createAdmission);
router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      let errorMessage = err.message;
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          errorMessage = "File size exceeds limit";
        } else {
          errorMessage = `Upload error: ${err.message}`;
        }
      }
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
    next();
  });
}, uploadDocument);
router.put("/:id/verify", verifyAdmission);
router.post("/:id/approve", approveAdmission);

export default router;
