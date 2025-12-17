const router = require("express").Router();
const o = require("../controllers/order.controller");
const { protect, requireRole } = require("../middleware/auth.middleware");

router.post("/", protect, o.createOrder);
router.get("/my", protect, o.myOrders);
router.get("/:id", protect, o.getOrder);

// Admin
router.get("/admin/all", protect, requireRole("admin"), o.adminListOrders);
router.patch("/admin/:id/status", protect, requireRole("admin"), o.adminUpdateStatus);

module.exports = router;
