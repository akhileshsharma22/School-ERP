import mongoose from "mongoose";
import dotenv from "dotenv";
import { getDashboardSummary } from "../controllers/dashboardController.js";

dotenv.config();

// Mock express request and response objects
const req = {
  query: {
    academicYear: "6a2fde894e21e38d94c3f5b8" // 2025-2026 Academic Year
  }
};

const res = {
  statusCode: 200,
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log("Response Code:", this.statusCode);
    console.log("Response JSON:", JSON.stringify(data, null, 2));
  }
};

const run = async () => {
  try {
    console.log("Connecting to MongoDB:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully. Running getDashboardSummary...");
    await getDashboardSummary(req, res);
    process.exit(0);
  } catch (err) {
    console.error("Execution error:", err);
    process.exit(1);
  }
};

run();
