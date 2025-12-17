const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const SupportTicket = require("../models/SupportTicket");

exports.createTicket = asyncHandler(async (req, res) => {
  const { subject, priority, message } = req.body;
  if (!subject) throw new AppError("Subject required", 400);

  const ticket = await SupportTicket.create({
    userId: req.user._id,
    subject,
    priority: priority || "medium",
    status: "open",
    messages: message
      ? [{ senderRole: "customer", text: message, at: new Date() }]
      : []
  });

  res.status(201).json({ ticket });
});

exports.myTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ userId: req.user._id }).sort("-createdAt");
  res.json({ tickets });
});

exports.addMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) throw new AppError("Message text required", 400);

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new AppError("Ticket not found", 404);

  const isOwner = String(ticket.userId) === String(req.user._id);
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) throw new AppError("Forbidden", 403);

  ticket.messages.push({
    senderRole: req.user.role,
    text,
    at: new Date()
  });

  if (ticket.status === "closed") ticket.status = "pending";
  await ticket.save();

  res.json({ ticket });
});

// ADMIN
exports.adminListTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find().populate("userId", "name email").sort("-createdAt");
  res.json({ tickets });
});

exports.adminUpdateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["open", "pending", "closed"];
  if (!allowed.includes(status)) throw new AppError("Invalid status", 400);

  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new AppError("Ticket not found", 404);

  ticket.status = status;
  await ticket.save();

  res.json({ ticket });
});
