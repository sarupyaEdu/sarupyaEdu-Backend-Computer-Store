// Basic filtering + search + sort + pagination
module.exports = function apiFeatures(query, qs) {
  let q = query;

  // Search by title
  if (qs.search) {
    q = q.find({ title: { $regex: qs.search, $options: "i" } });
  }

  // Category filter
  if (qs.category) {
    q = q.find({ category: qs.category });
  }

  // Price range
  const minPrice = qs.minPrice ? Number(qs.minPrice) : null;
  const maxPrice = qs.maxPrice ? Number(qs.maxPrice) : null;
  if (minPrice !== null || maxPrice !== null) {
    q = q.find({
      price: {
        ...(minPrice !== null ? { $gte: minPrice } : {}),
        ...(maxPrice !== null ? { $lte: maxPrice } : {}),
      },
    });
  }

  // Sort
  if (qs.sort) {
    // e.g. sort=price,-createdAt
    q = q.sort(qs.sort.split(",").join(" "));
  } else {
    q = q.sort("-createdAt");
  }

  // Pagination
  const page = qs.page ? Number(qs.page) : 1;
  const limit = qs.limit ? Number(qs.limit) : 12;
  const skip = (page - 1) * limit;
  q = q.skip(skip).limit(limit);

  return q;
};
