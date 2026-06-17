import mongoose from "mongoose";

import ExamType from "../models/ExamType.js";

const normalizeText = (value) =>
  String(value || "").trim();

const normalizeApplicableClasses = (classes) => {
  if (!Array.isArray(classes)) return [];

  return classes.map((cls) => ({
    classId: cls.classId,
    className: normalizeText(cls.className),
  }));
};

const validateExamTypePayload = (payload) => {
  const examName = normalizeText(payload.examName);

  if (!examName) {
    return "Exam name is required";
  }

  const examCode = normalizeText(payload.examCode);

  if (!examCode) {
    return "Exam code is required";
  }

  const weightage = Number(payload.weightage);

  if (
    !Number.isFinite(weightage) ||
    weightage <= 0
  ) {
    return "Weightage must be a positive number";
  }

  if (weightage > 100) {
    return "Weightage cannot exceed 100%";
  }

  const applicableClasses = normalizeApplicableClasses(
    payload.applicableClasses
  );

  for (const cls of applicableClasses) {
    if (
      !cls.classId ||
      !mongoose.Types.ObjectId.isValid(cls.classId)
    ) {
      return "Valid class is required for each assignment";
    }
  }

  return null;
};

const buildExamTypePayload = (payload) => ({
  examName: normalizeText(payload.examName),
  examCode: normalizeText(
    payload.examCode
  ).toUpperCase(),
  weightage: Number(payload.weightage),
  applicableClasses: normalizeApplicableClasses(
    payload.applicableClasses
  ),
});

export const getExamTypes = async (req, res) => {
  try {
    const examTypes = await ExamType.find().sort({
      examName: 1,
    });

    return res.status(200).json({
      success: true,
      examTypes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createExamType = async (req, res) => {
  try {
    const validationError =
      validateExamTypePayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const examType = await ExamType.create(
      buildExamTypePayload(req.body)
    );

    return res.status(201).json({
      success: true,
      message: "Exam type created successfully",
      examType,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(
        error.keyPattern || {}
      )[0];

      return res.status(400).json({
        success: false,
        message:
          field === "examCode"
            ? "Exam code already exists"
            : "Exam name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateExamType = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam type id",
      });
    }

    const validationError =
      validateExamTypePayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const examType = await ExamType.findById(id);

    if (!examType) {
      return res.status(404).json({
        success: false,
        message: "Exam type not found",
      });
    }

    const payload = buildExamTypePayload(req.body);

    examType.examName = payload.examName;
    examType.examCode = payload.examCode;
    examType.weightage = payload.weightage;
    examType.applicableClasses =
      payload.applicableClasses;

    await examType.save();

    return res.status(200).json({
      success: true,
      message: "Exam type updated successfully",
      examType,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(
        error.keyPattern || {}
      )[0];

      return res.status(400).json({
        success: false,
        message:
          field === "examCode"
            ? "Exam code already exists"
            : "Exam name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteExamType = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam type id",
      });
    }

    const examType = await ExamType.findById(id);

    if (!examType) {
      return res.status(404).json({
        success: false,
        message: "Exam type not found",
      });
    }

    await ExamType.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Exam type deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
