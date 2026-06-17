import mongoose from "mongoose";
import Category from "../models/Category.js";
import Student from "../models/Student.js";
import Admission from "../models/Admission.js";

const normalizeText = (value) => String(value || "").trim();

const validateCategoryPayload = (payload) => {
  const name = normalizeText(payload.name);
  const shortCode = normalizeText(payload.shortCode);
  const categoryType = normalizeText(payload.categoryType);

  if (!name) {
    return "Category name is required";
  }

  if (!shortCode) {
    return "Short code is required";
  }

  if (!categoryType) {
    return "Category type is required";
  }

  if (name.length < 2 || name.length > 50) {
    return "Category name must be between 2 and 50 characters";
  }

  if (shortCode.length > 10) {
    return "Short code cannot exceed 10 characters";
  }

  const validTypes = [
    "General",
    "OBC",
    "SC",
    "ST",
    "EWS",
    "Minority",
    "Management Quota",
    "Sports Quota",
    "Defence",
    "Physically Disabled",
    "Other",
  ];

  if (!validTypes.includes(categoryType)) {
    return "Invalid category type";
  }

  return null;
};

const buildCategoryPayload = (payload) => ({
  name: normalizeText(payload.name),
  shortCode: normalizeText(payload.shortCode).toUpperCase(),
  categoryType: normalizeText(payload.categoryType),
  description: normalizeText(payload.description),
  status: normalizeText(payload.status) || "Active",
});

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const categoryNames = categories.map((c) => c.name);

    // Aggregate students count by category name
    const studentCounts = await Student.aggregate([
      { $match: { category: { $in: categoryNames } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    studentCounts.forEach((sc) => {
      countMap[sc._id] = sc.count;
    });

    const categoriesWithCount = categories.map((cat) => {
      const catObj = cat.toObject();
      return {
        ...catObj,
        studentsCount: countMap[catObj.name] || 0,
      };
    });

    return res.status(200).json({
      success: true,
      categories: categoriesWithCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const validationError = validateCategoryPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const payload = buildCategoryPayload(req.body);

    // Case-insensitive pre-check using collation for exact matches
    const existingName = await Category.findOne({
      name: payload.name,
    }).collation({ locale: "en", strength: 2 });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const existingCode = await Category.findOne({
      shortCode: payload.shortCode,
    }).collation({ locale: "en", strength: 2 });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "Short code already exists",
      });
    }

    const category = await Category.create(payload);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message:
          field === "shortCode"
            ? "Short code already exists"
            : "Category already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id",
      });
    }

    const validationError = validateCategoryPayload(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const payload = buildCategoryPayload(req.body);

    // Pre-check for duplicate name using collation
    const existingName = await Category.findOne({
      name: payload.name,
      _id: { $ne: id },
    }).collation({ locale: "en", strength: 2 });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Pre-check for duplicate short code using collation
    const existingCode = await Category.findOne({
      shortCode: payload.shortCode,
      _id: { $ne: id },
    }).collation({ locale: "en", strength: 2 });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: "Short code already exists",
      });
    }

    category.name = payload.name;
    category.shortCode = payload.shortCode;
    category.categoryType = payload.categoryType;
    category.description = payload.description;
    category.status = payload.status;

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message:
          field === "shortCode"
            ? "Short code already exists"
            : "Category already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category id",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Dependency Check
    // Do not allow deletion if Students or Admissions use this category
    const studentExists = await Student.findOne({ category: category.name });
    if (studentExists) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category because it is already assigned to records.",
      });
    }

    const admissionExists = await Admission.findOne({ category: category.name });
    if (admissionExists) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category because it is already assigned to records.",
      });
    }

    await Category.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
