import mongoose from "mongoose";

import Designation from "../models/Designation.js";

const normalizeText = (value) =>
  String(value || "").trim();

const normalizeDepartments = (departments) => {
  if (!Array.isArray(departments)) return [];

  return departments.map((dept) => ({
    departmentId: dept.departmentId,
    departmentName: normalizeText(dept.departmentName),
  }));
};

const validateDesignationPayload = (payload) => {
  const designationName = normalizeText(
    payload.designationName
  );

  if (!designationName) {
    return "Designation name is required";
  }

  const designationCode = normalizeText(
    payload.designationCode
  );

  if (!designationCode) {
    return "Designation code is required";
  }

  const departments = normalizeDepartments(
    payload.departments
  );

  if (!departments.length) {
    return "At least one department is required";
  }

  for (const dept of departments) {
    if (
      !dept.departmentId ||
      !mongoose.Types.ObjectId.isValid(dept.departmentId)
    ) {
      return "Valid department is required for each mapping";
    }
  }

  return null;
};

const buildDesignationPayload = (payload) => ({
  designationName: normalizeText(
    payload.designationName
  ),
  designationCode: normalizeText(
    payload.designationCode
  ).toUpperCase(),
  departments: normalizeDepartments(
    payload.departments
  ),
});

export const getDesignations = async (req, res) => {
  try {
    const designations =
      await Designation.find().sort({
        designationName: 1,
      });

    return res.status(200).json({
      success: true,
      designations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createDesignation = async (req, res) => {
  try {
    const validationError =
      validateDesignationPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const designation = await Designation.create(
      buildDesignationPayload(req.body)
    );

    return res.status(201).json({
      success: true,
      message: "Designation created successfully",
      designation,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(
        error.keyPattern || {}
      )[0];

      return res.status(400).json({
        success: false,
        message:
          field === "designationCode"
            ? "Designation code already exists"
            : "Designation name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid designation id",
      });
    }

    const validationError =
      validateDesignationPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const designation = await Designation.findById(id);

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    const payload = buildDesignationPayload(req.body);

    designation.designationName = payload.designationName;
    designation.designationCode = payload.designationCode;
    designation.departments = payload.departments;

    await designation.save();

    return res.status(200).json({
      success: true,
      message: "Designation updated successfully",
      designation,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(
        error.keyPattern || {}
      )[0];

      return res.status(400).json({
        success: false,
        message:
          field === "designationCode"
            ? "Designation code already exists"
            : "Designation name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteDesignation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid designation id",
      });
    }

    const designation = await Designation.findById(id);

    if (!designation) {
      return res.status(404).json({
        success: false,
        message: "Designation not found",
      });
    }

    await Designation.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Designation deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
