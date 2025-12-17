const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Order = require("../models/Order");
const Product = require("../models/Product");

const calcTotal = (items) =>
  items.reduce((sum, it) => sum + it.priceSnapshot * it.qty, 0);

exports.createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!Array.isArray(items) || items.length === 0) throw new AppError("Cart items required", 400);

  // Validate products + stock, snapshot title & price
  const snapshotItems = [];
  for (const it of items) {
    const product = await Product.findById(it.productId);
    if (!product) throw new AppError("Product not found", 404);
    if (!product.isActive) throw new AppError(`Product unavailable: ${product.title}`, 400);

    const qty = Number(it.qty || 0);
    if (qty <= 0) throw new AppError("Invalid quantity", 400);
    if (product.stock < qty) throw new AppError(`Not enough stock for ${product.title}`, 400);

    const priceSnapshot = product.discountPrice ?? product.price;

    snapshotItems.push({
      productId: product._id,
      titleSnapshot: product.title,
      priceSnapshot,
      qty
    });

    // reduce stock
    product.stock -= qty;
    await product.save();
  }

  const totalAmount = calcTotal(snapshotItems);

  const order = await Order.create({
    userId: req.user._id,
    items: snapshotItems,
    shippingAddress: shippingAddress || {},
    totalAmount,
    payment: { method: paymentMethod || "COD", status: "PENDING" },
    status: "PLACED",
    statusHistory: [{ status: "PLACED", at: new Date(), note: "Order placed" }]
  });

  res.status(201).json({ order });
});

exports.myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort("-createdAt");
  res.json({ orders });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);

  // customer can only read own order
  const isOwner = String(order.userId) === String(req.user._id);
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) throw new AppError("Forbidden", 403);

  res.json({ order });
});

// ADMIN
exports.adminListOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate("userId", "name email").sort("-createdAt");
  res.json({ orders });
});

exports.adminUpdateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const allowed = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(status)) throw new AppError("Invalid status", 400);

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);

  order.status = status;
  order.statusHistory.push({ status, at: new Date(), note: note || "" });
  await order.save();

  res.json({ order });
});
