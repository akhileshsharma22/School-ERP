import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          message: "Not authorized, user not found",
        });
      }

      return next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Your session has expired. Please login again.",
        });
      }
      return res.status(401).json({
        message: "Not authorized, token validation failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, token missing",
    });
  }
};
