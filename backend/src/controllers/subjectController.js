import mongoose from "mongoose";

import Subject from "../models/Subject.js";

const normalizeText = (value) =>
  String(value || "").trim();

const VALID_SUBJECT_TYPES = [
  "Core",
  "Elective",
  "Language",
  "Practical",
  "Optional",
];

const normalizeAssignments = (assignments) => {
  if (!Array.isArray(assignments)) return [];

  return assignments.map((assignment) => ({
    classId: assignment.classId,
    className: normalizeText(assignment.className),
    maxMarks: Number(assignment.maxMarks),
    passingMarks: Number(assignment.passingMarks),
  }));
};

const validateSubjectPayload = (payload) => {
  const subjectName = normalizeText(payload.subjectName);

  if (!subjectName) {
    return "Subject name is required";
  }

  const subjectCode = normalizeText(payload.subjectCode);

  if (!subjectCode) {
    return "Subject code is required";
  }

  if (!VALID_SUBJECT_TYPES.includes(payload.subjectType)) {
    return "Valid subject type is required";
  }

  const assignments = normalizeAssignments(
    payload.classAssignments
  );

  for (const assignment of assignments) {
    if (
      !assignment.classId ||
      !mongoose.Types.ObjectId.isValid(assignment.classId)
    ) {
      return "Valid class is required for each assignment";
    }

    if (
      !Number.isFinite(assignment.maxMarks) ||
      assignment.maxMarks <= 0
    ) {
      return "Max marks must be greater than 0";
    }

    if (
      !Number.isFinite(assignment.passingMarks) ||
      assignment.passingMarks < 0
    ) {
      return "Passing marks must be 0 or greater";
    }

    if (assignment.passingMarks > assignment.maxMarks) {
      return "Passing marks cannot exceed max marks";
    }
  }

  return null;
};

const buildSubjectPayload = (payload) => ({
  subjectName: normalizeText(payload.subjectName),
  subjectCode: normalizeText(payload.subjectCode).toUpperCase(),
  subjectType: payload.subjectType,
  classAssignments: normalizeAssignments(
    payload.classAssignments
  ),
});

export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({
      subjectName: 1,
    });

    return res.status(200).json({
      success: true,
      subjects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createSubject = async (req, res) => {
  try {
    const validationError = validateSubjectPayload(
      req.body
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const subject = await Subject.create(
      buildSubjectPayload(req.body)
    );

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(
        error.keyPattern || {}
      )[0];

      return res.status(400).json({
        success: false,
        message:
          field === "subjectCode"
            ? "Subject code already exists"
            : "Subject name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject id",
      });
    }

    const validationError = validateSubjectPayload(
      req.body
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const payload = buildSubjectPayload(req.body);

    subject.subjectName = payload.subjectName;
    subject.subjectCode = payload.subjectCode;
    subject.subjectType = payload.subjectType;
    subject.classAssignments = payload.classAssignments;

    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(
        error.keyPattern || {}
      )[0];

      return res.status(400).json({
        success: false,
        message:
          field === "subjectCode"
            ? "Subject code already exists"
            : "Subject name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject id",
      });
    }

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    await Subject.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
