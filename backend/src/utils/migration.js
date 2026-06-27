import mongoose from "mongoose";
import ClassSection from "../models/ClassSection.js";
import Exam from "../models/Exam.js";
import ExamType from "../models/ExamType.js";

export const migrateLegacyExamClasses = async () => {
  try {
    console.log("Running Exam and ExamType classes normalization migration...");

    // 1. Fetch ClassSections map className -> classId
    const classes = await ClassSection.find({}).lean();
    const classMap = new Map();
    classes.forEach((c) => {
      classMap.set(c.className.toLowerCase(), c._id);
    });

    const normalize = (applicableClasses) => {
      if (!Array.isArray(applicableClasses)) return [];
      const normalized = [];
      for (const item of applicableClasses) {
        if (!item) continue;
        if (typeof item === "string") {
          const className = item.trim();
          const classId = classMap.get(className.toLowerCase()) || new mongoose.Types.ObjectId();
          normalized.push({ classId, className, sections: [] });
        } else if (item.classId && item.className) {
          normalized.push({
            classId: item.classId,
            className: item.className,
            sections: Array.isArray(item.sections) ? item.sections : []
          });
        } else if (item.className) {
          const className = item.className.trim();
          const classId = classMap.get(className.toLowerCase()) || item.classId || new mongoose.Types.ObjectId();
          normalized.push({ classId, className, sections: Array.isArray(item.sections) ? item.sections : [] });
        }
      }
      return normalized;
    };

    // 2. Normalize Exam records
    const exams = await Exam.find({}).lean();
    let examMigratedCount = 0;
    for (const ex of exams) {
      if (!ex.applicableClasses || !Array.isArray(ex.applicableClasses)) continue;
      const needsMigration = ex.applicableClasses.some(
        (ac) => typeof ac === "string" || !ac.classId || !ac.className
      );
      if (needsMigration) {
        const normalized = normalize(ex.applicableClasses);
        await Exam.updateOne(
          { _id: ex._id },
          { $set: { applicableClasses: normalized } }
        );
        examMigratedCount++;
      }
    }
    if (examMigratedCount > 0) {
      console.log(`Successfully migrated ${examMigratedCount} legacy Exam records.`);
    }

    // 3. Normalize ExamType records
    const examTypes = await ExamType.find({}).lean();
    let typeMigratedCount = 0;
    for (const et of examTypes) {
      if (!et.applicableClasses || !Array.isArray(et.applicableClasses)) continue;
      const needsMigration = et.applicableClasses.some(
        (ac) => typeof ac === "string" || !ac.classId || !ac.className
      );
      if (needsMigration) {
        const normalized = normalize(et.applicableClasses);
        await ExamType.updateOne(
          { _id: et._id },
          { $set: { applicableClasses: normalized } }
        );
        typeMigratedCount++;
      }
    }
    if (typeMigratedCount > 0) {
      console.log(`Successfully migrated ${typeMigratedCount} legacy ExamType records.`);
    }

    console.log("Exam and ExamType class migration finished.");
  } catch (error) {
    console.error("Migration Error:", error);
  }
};
