const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    throw new AppError("Not authorized. No token.", 401);
  }

  const token = auth.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select("-passwordHash");
  if (!user) throw new AppError("User not found", 401);

  req.user = user;
  next();
});

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError("Not authorized", 401));
  if (!roles.includes(req.user.role)) {
    return next(new AppError("Forbidden: insufficient permissions", 403));
  }
  next();
};

module.exports = { protect, requireRole };
