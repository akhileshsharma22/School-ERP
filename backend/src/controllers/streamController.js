import mongoose from "mongoose";

import Stream from "../models/Stream.js";

const VALID_CLASSES = ["Class 11", "Class 12"];
const VALID_STATUSES = ["Active", "Inactive"];

const normalizeText = (value) =>
  String(value || "").trim().replace(/\s+/g, " ");

const normalizeList = (items) => {
  if (!Array.isArray(items)) return [];

  const uniqueItems = new Map();

  items.forEach((item) => {
    const normalizedItem = normalizeText(item);
    const key = normalizedItem.toLowerCase();

    if (normalizedItem && !uniqueItems.has(key)) {
      uniqueItems.set(key, normalizedItem);
    }
  });

  return [...uniqueItems.values()];
};

const buildStreamPayload = (payload) => ({
  streamName: normalizeText(payload.streamName),
  streamCode: normalizeText(payload.streamCode).toUpperCase(),
  description: normalizeText(payload.description),
  applicableClasses: normalizeList(
    payload.applicableClasses
  ),
  compulsorySubjects: normalizeList(
    payload.compulsorySubjects
  ),
  optionalSubjects: normalizeList(
    payload.optionalSubjects
  ),
  status: payload.status || "Active",
});

const validateStreamPayload = (payload) => {
  if (!payload.streamName) {
    return "Stream name is required";
  }

  if (!payload.streamCode) {
    return "Stream code is required";
  }

  if (
    !/^[A-Z0-9][A-Z0-9_-]*$/.test(payload.streamCode)
  ) {
    return "Stream code can contain only letters, numbers, hyphens, and underscores";
  }

  if (!payload.applicableClasses.length) {
    return "At least one applicable class is required";
  }

  if (
    payload.applicableClasses.some(
      (className) => !VALID_CLASSES.includes(className)
    )
  ) {
    return "Streams are applicable only to Class 11 and Class 12";
  }

  if (!payload.compulsorySubjects.length) {
    return "At least one compulsory subject is required";
  }

  if (!VALID_STATUSES.includes(payload.status)) {
    return "Valid status is required";
  }

  const compulsorySubjectKeys = new Set(
    payload.compulsorySubjects.map((subject) =>
      subject.toLowerCase()
    )
  );

  const overlappingSubject = payload.optionalSubjects.find(
    (subject) =>
      compulsorySubjectKeys.has(subject.toLowerCase())
  );

  if (overlappingSubject) {
    return `${overlappingSubject} cannot be both compulsory and optional`;
  }

  return null;
};

const getDuplicateStream = async (
  payload,
  excludedId = null
) => {
  const duplicateQuery = {
    $or: [
      {
        streamName: {
          $regex: `^${escapeRegExp(payload.streamName)}$`,
          $options: "i",
        },
      },
      {
        streamCode: {
          $regex: `^${escapeRegExp(payload.streamCode)}$`,
          $options: "i",
        },
      },
    ],
  };

  if (excludedId) {
    duplicateQuery._id = { $ne: excludedId };
  }

  return Stream.findOne(duplicateQuery).select(
    "streamName streamCode"
  );
};

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getDuplicateMessage = (duplicate, payload) => {
  if (
    duplicate.streamName.toLowerCase() ===
    payload.streamName.toLowerCase()
  ) {
    return "Stream name already exists";
  }

  return "Stream code already exists";
};

const handleServerError = (error, res) => {
  if (error?.code === 11000) {
    const duplicateField = Object.keys(
      error.keyPattern || error.keyValue || {}
    )[0];

    return res.status(409).json({
      success: false,
      message:
        duplicateField === "streamCode"
          ? "Stream code already exists"
          : "Stream name already exists",
    });
  }

  if (error?.name === "ValidationError") {
    const message =
      Object.values(error.errors || {})[0]?.message ||
      "Invalid stream data";

    return res.status(400).json({
      success: false,
      message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unable to process stream request",
  });
};

export const getStreams = async (req, res) => {
  try {
    const streams = await Stream.find()
      .collation({ locale: "en", strength: 2 })
      .sort({ streamName: 1 });

    return res.status(200).json({
      success: true,
      count: streams.length,
      streams,
    });
  } catch (error) {
    return handleServerError(error, res);
  }
};

export const createStream = async (req, res) => {
  try {
    const payload = buildStreamPayload(req.body);
    const validationError =
      validateStreamPayload(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const duplicate = await getDuplicateStream(payload);

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: getDuplicateMessage(
          duplicate,
          payload
        ),
      });
    }

    const stream = await Stream.create(payload);

    return res.status(201).json({
      success: true,
      message: "Stream created successfully",
      stream,
    });
  } catch (error) {
    return handleServerError(error, res);
  }
};

export const updateStream = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const payload = buildStreamPayload(req.body);
    const validationError =
      validateStreamPayload(payload);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const existingStream = await Stream.findById(id);

    if (!existingStream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    const duplicate = await getDuplicateStream(
      payload,
      existingStream._id
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: getDuplicateMessage(
          duplicate,
          payload
        ),
      });
    }

    existingStream.set(payload);
    await existingStream.save();

    return res.status(200).json({
      success: true,
      message: "Stream updated successfully",
      stream: existingStream,
    });
  } catch (error) {
    return handleServerError(error, res);
  }
};

export const deleteStream = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream id",
      });
    }

    const stream = await Stream.findByIdAndDelete(id);

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stream deleted permanently",
      id,
    });
  } catch (error) {
    return handleServerError(error, res);
  }
};
