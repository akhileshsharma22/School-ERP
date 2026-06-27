import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Staff from "../models/Staff.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { employeeId: identifier },
        { admissionNo: identifier },
      ],
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const accessToken =
      generateAccessToken(user);

    const refreshToken =
      generateRefreshToken(user);

    user.refreshToken = refreshToken;

    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,

      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl || "",
        assignedClasses: user.assignedClasses || []
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (fullName) user.fullName = fullName;
    if (email) user.email = email;

    if (req.file) {
      user.photoUrl = `/uploads/${req.file.filename}`;
    }

    await user.save();

    // Sync with corresponding Staff profile if teacher
    if (user.role === "TEACHER" && user.employeeId) {
      const staffUpdate = {};
      if (fullName) {
        const parts = fullName.trim().split(" ");
        staffUpdate.firstName = parts[0];
        staffUpdate.lastName = parts.slice(1).join(" ") || ".";
      }
      if (email) staffUpdate.email = email;
      if (req.file) staffUpdate.photoUrl = user.photoUrl;

      await Staff.findOneAndUpdate({ employeeId: user.employeeId }, { $set: staffUpdate });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl || "",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide current and new passwords." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password." });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};