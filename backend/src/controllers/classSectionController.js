import mongoose from "mongoose";

import ClassSection from "../models/ClassSection.js";

const VALID_STATUSES = ["Active", "Inactive"];

const normalizeText = (value) =>
  String(value || "").trim();

const normalizeExamTypes = (examTypes) => {
  if (!Array.isArray(examTypes)) return [];

  return [
    ...new Set(
      examTypes
        .map((item) => normalizeText(item))
        .filter(Boolean)
    ),
  ];
};

const normalizeSections = (sections) => {
  if (!Array.isArray(sections)) return [];

  return sections.map((section) => ({
    sectionName: normalizeText(
      section.sectionName
    ),
    capacity: Number(section.capacity),
    classTeacher: normalizeText(
      section.classTeacher
    ),
  }));
};

const validateClassSectionPayload = (
  payload
) => {
  const className = normalizeText(
    payload.className
  );

  if (!className) {
    return "Class name is required";
  }

  if (!VALID_STATUSES.includes(payload.status)) {
    return "Valid status is required";
  }

  const examTypes = normalizeExamTypes(
    payload.examTypes
  );

  if (!examTypes.length) {
    return "At least one exam type is required";
  }

  const sections = normalizeSections(
    payload.sections
  );

  if (!sections.length) {
    return "At least one section is required";
  }

  const sectionNames = new Set();

  for (const section of sections) {
    if (!section.sectionName) {
      return "Section name is required";
    }

    if (
      !Number.isFinite(section.capacity) ||
      section.capacity <= 0
    ) {
      return "Section capacity must be greater than 0";
    }

    const sectionKey =
      section.sectionName.toLowerCase();

    if (sectionNames.has(sectionKey)) {
      return "Duplicate section names are not allowed inside the same class";
    }

    sectionNames.add(sectionKey);
  }

  return null;
};

const buildClassSectionPayload = (
  payload,
  fallbackDisplayOrder
) => ({
  className: normalizeText(payload.className),
  displayOrder: Number(
    payload.displayOrder || fallbackDisplayOrder
  ),
  status: payload.status,
  examTypes: normalizeExamTypes(
    payload.examTypes
  ),
  sections: normalizeSections(
    payload.sections
  ),
});

const getNextDisplayOrder = async () => {
  const lastClass =
    await ClassSection.findOne()
      .sort({
        displayOrder: -1,
      })
      .select("displayOrder");

  return Number(lastClass?.displayOrder || 0) + 1;
};

export const getClassSections = async (
  req,
  res
) => {
  try {
    const classes =
      await ClassSection.find().sort({
        displayOrder: 1,
        className: 1,
      });

    return res.status(200).json({
      success: true,
      classes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createClassSection = async (
  req,
  res
) => {
  try {
    const validationError =
      validateClassSectionPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const displayOrder =
      req.body.displayOrder ||
      (await getNextDisplayOrder());

    const classSection =
      await ClassSection.create(
        buildClassSectionPayload(
          req.body,
          displayOrder
        )
      );

    return res.status(201).json({
      success: true,
      message:
        "Class and sections created successfully",
      classSection,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Class name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateClassSection = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class id",
      });
    }

    const validationError =
      validateClassSectionPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const classSection =
      await ClassSection.findById(id);

    if (!classSection) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const payload = buildClassSectionPayload(
      req.body,
      classSection.displayOrder
    );

    classSection.className = payload.className;
    classSection.displayOrder =
      payload.displayOrder;
    classSection.status = payload.status;
    classSection.examTypes = payload.examTypes;
    classSection.sections = payload.sections;

    await classSection.save();

    return res.status(200).json({
      success: true,
      message:
        "Class and sections updated successfully",
      classSection,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Class name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteClassSection = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class id",
      });
    }

    const classSection =
      await ClassSection.findById(id);

    if (!classSection) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    await ClassSection.deleteOne({
      _id: id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Class and sections deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
