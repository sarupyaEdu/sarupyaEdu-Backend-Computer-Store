const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    titleSnapshot: String,
    priceSnapshot: Number,
    qty: Number
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },

    shippingAddress: {
      name: String,
      phone: String,
      addressLine1: String,
      city: String,
      state: String,
      pincode: String
    },

    totalAmount: { type: Number, required: true },

    payment: {
      method: { type: String, default: "COD" }, // COD / UPI / CARD later
      status: { type: String, default: "PENDING" }, // PENDING/PAID/FAILED
      txnId: { type: String }
    },

    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PLACED"
    },
    statusHistory: [
      {
        status: String,
        at: Date,
        note: String
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
