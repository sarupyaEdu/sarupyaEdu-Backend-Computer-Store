const router = require("express").Router();
const { register, registerAdmin, login, me } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", register);             // customer register
router.post("/register-admin", registerAdmin);  // admin register
router.post("/login", login);
router.get("/me", protect, me);

module.exports = router;
