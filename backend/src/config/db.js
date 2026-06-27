import mongoose from "mongoose";
import { migrateLegacyExamClasses } from "../utils/migration.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      `MongoDB Connected: ${conn.connection.host}`
    );

    // Asynchronously run legacy data migration
    migrateLegacyExamClasses();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;