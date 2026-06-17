import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import academicYearRoutes from "./routes/academicYearRoutes.js";
import classSectionRoutes from "./routes/classSectionRoutes.js";
import streamRoutes from "./routes/streamRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import designationRoutes from "./routes/designationRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import examTypeRoutes from "./routes/examTypeRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import admissionRoutes from "./routes/admissionRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import examScheduleRoutes from "./routes/examScheduleRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Serve static uploads
app.use("/uploads", express.static("public/uploads"));

app.use("/api/auth", authRoutes);

app.use(
  "/api/master/academic-years",
  academicYearRoutes
);

app.use(
  "/api/master/classes-sections",
  classSectionRoutes
);

app.use("/api/master/streams", streamRoutes);

app.use("/api/master/subjects", subjectRoutes);

app.use(
  "/api/master/departments",
  departmentRoutes
);

app.use(
  "/api/master/designations",
  designationRoutes
);

app.use("/api/master/categories", categoryRoutes);

app.use("/api/master/exam-types", examTypeRoutes);

app.use("/api/admissions/enquiries", enquiryRoutes);
app.use("/api/admissions/applications", admissionRoutes);

app.use("/api/students", studentRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/exam-schedules", examScheduleRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/dashboard", dashboardRoutes);

export default app;

