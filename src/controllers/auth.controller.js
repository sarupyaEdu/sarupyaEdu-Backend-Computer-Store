const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) throw new AppError("Name, email, password required", 400);

  const exists = await User.findOne({ email });
  if (exists) throw new AppError("Email already registered", 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: "customer" });

  const token = signToken(user._id);
  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError("Email & password required", 400);

  const user = await User.findOne({ email });
  if (!user) throw new AppError("Invalid credentials", 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const token = signToken(user._id);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

exports.registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, adminSecret } = req.body;

  // 1) basic checks
  if (!name || !email || !password) throw new AppError("Name, email, password required", 400);

  // 2) check secret (this protects admin registration)
  if (!adminSecret || adminSecret !== process.env.ADMIN_REGISTER_SECRET) {
    throw new AppError("Invalid admin secret", 403);
  }

  // 3) check if email exists
  const exists = await User.findOne({ email });
  if (exists) throw new AppError("Email already registered", 409);

  // 4) hash password & create admin
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "admin"
  });

  // 5) return token
  const token = signToken(user._id);
  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

