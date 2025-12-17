const router = require("express").Router();
const s = require("../controllers/support.controller");
const { protect, requireRole } = require("../middleware/auth.middleware");

router.post("/", protect, s.createTicket);
router.get("/my", protect, s.myTickets);
router.post("/:id/message", protect, s.addMessage);

// Admin
router.get("/admin/all", protect, requireRole("admin"), s.adminListTickets);
router.patch("/admin/:id/status", protect, requireRole("admin"), s.adminUpdateStatus);

module.exports = router;
