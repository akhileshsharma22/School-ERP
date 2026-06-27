export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized, user credentials missing",
      });
    }

    if (req.user.role === "ADMIN") {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      if (req.originalUrl.includes("/approve")) {
        return res.status(403).json({
          message: "You do not have permission to approve admissions.",
        });
      }
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};
