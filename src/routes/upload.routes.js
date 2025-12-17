const router = require("express").Router();
const { uploadImage, uploadImages, deleteImage } = require("../controllers/upload.controller");
const { protect, requireRole } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");


// Admin only
router.post("/image", protect, requireRole("admin"), upload.single("image"), uploadImage);

// ✅ Multiple images (max 6)
router.post("/images", protect, requireRole("admin"), upload.array("images", 6), uploadImages);

// ✅ Delete by public_id
router.delete("/image", protect, requireRole("admin"), deleteImage);

module.exports = router;
