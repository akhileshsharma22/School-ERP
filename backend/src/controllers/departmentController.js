import mongoose from "mongoose";

import Department from "../models/Department.js";

const normalizeText = (value) =>
  String(value || "").trim();

const validateDepartmentPayload = (payload) => {
  const departmentName = normalizeText(
    payload.departmentName
  );

  if (!departmentName) {
    return "Department name is required";
  }

  const departmentCode = normalizeText(
    payload.departmentCode
  );

  if (!departmentCode) {
    return "Department code is required";
  }

  return null;
};

const buildDepartmentPayload = (payload) => ({
  departmentName: normalizeText(payload.departmentName),
  departmentCode: normalizeText(
    payload.departmentCode
  ).toUpperCase(),
  description: normalizeText(payload.description),
});

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({
      departmentName: 1,
    });

    return res.status(200).json({
      success: true,
      departments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const validationError =
      validateDepartmentPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const department = await Department.create(
      buildDepartmentPayload(req.body)
    );

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(
        error.keyPattern || {}
      )[0];

      return res.status(400).json({
        success: false,
        message:
          field === "departmentCode"
            ? "Department code already exists"
            : "Department name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department id",
      });
    }

    const validationError =
      validateDepartmentPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const payload = buildDepartmentPayload(req.body);

    department.departmentName = payload.departmentName;
    department.departmentCode = payload.departmentCode;
    department.description = payload.description;

    await department.save();

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(
        error.keyPattern || {}
      )[0];

      return res.status(400).json({
        success: false,
        message:
          field === "departmentCode"
            ? "Department code already exists"
            : "Department name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department id",
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    await Department.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
