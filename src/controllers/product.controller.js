const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const Product = require("../models/Product");
const apiFeatures = require("../utils/apiFeatures");
const { cloudinary } = require("../config/cloudinary");

const slugify = (s) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

exports.list = asyncHandler(async (req, res) => {
  const base = Product.find({ isActive: true }).populate(
    "category",
    "name slug"
  );
  const q = apiFeatures(base, req.query);
  const products = await q;
  res.json({ products });
});

exports.getBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate(
    "category",
    "name slug"
  );
  if (!product) throw new AppError("Product not found", 404);
  res.json({ product });
});

exports.create = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    price,
    discountPrice,
    category,
    brand,
    specs,
    tags,
    images,
    stock,
    isActive,
  } = req.body;

  if (!title || price === undefined || !category) {
    throw new AppError("title, price, category required", 400);
  }

  const product = await Product.create({
    title,
    slug: slugify(title),
    description: description || "",
    price,
    discountPrice,
    category,
    brand: brand || "",
    specs: specs || {},
    tags: tags || [],
    images: Array.isArray(images) ? images : [],
    stock: stock ?? 0,
    isActive: isActive ?? true,
  });

  res.status(201).json({ product });
});

exports.update = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (payload.title) payload.slug = slugify(payload.title);

  const product = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
  });
  if (!product) throw new AppError("Product not found", 404);

  res.json({ product });
});

exports.remove = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError("Product not found", 404);

  // ✅ delete cloudinary images first (if configured)
  if (process.env.CLOUDINARY_CLOUD_NAME && product.images?.length) {
    for (const img of product.images) {
      if (img?.public_id) {
        try {
          await cloudinary.uploader.destroy(img.public_id, {
            resource_type: "image",
          });
        } catch (err) {
          // don't crash if cloudinary delete fails
          console.log(
            "Cloudinary delete failed for:",
            img.public_id,
            err.message
          );
        }
      }
    }
  }

  await product.deleteOne();

  res.json({ message: "Product deleted (images cleaned up)" });
});

exports.removeProductImage = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { public_id } = req.body;

  if (!public_id) throw new AppError("public_id is required", 400);

  const product = await Product.findById(productId);
  if (!product) throw new AppError("Product not found", 404);

  // ✅ OPTIONAL SAFETY: prevent deleting the last image
  if (product.images.length <= 1) {
    throw new AppError("Cannot delete the last image of a product", 400);
  }

  // Check image exists in product
  const exists = product.images?.some((img) => img.public_id === public_id);
  if (!exists) throw new AppError("Image not found in this product", 404);

  // ✅ Delete from Cloudinary (if configured)
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      await cloudinary.uploader.destroy(public_id, { resource_type: "image" });
    } catch (err) {
      console.log("Cloudinary delete failed:", public_id, err.message);
    }
  }

  // ✅ Remove from DB array
  product.images = product.images.filter((img) => img.public_id !== public_id);
  await product.save();

  res.json({
    message: "Image removed from product",
    product,
  });
});
