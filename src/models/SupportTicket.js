const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderRole: { type: String, enum: ["customer", "admin"], required: true },
    text: { type: String, required: true },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const supportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["open", "pending", "closed"], default: "open" },
    messages: { type: [messageSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
