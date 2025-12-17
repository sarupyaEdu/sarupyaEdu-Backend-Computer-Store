require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db.js");
const { initCloudinary } = require("./config/cloudinary");

const PORT = process.env.PORT || 4500;

(async () => {
  await connectDB(process.env.MONGO_URI);
  initCloudinary();
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
})();
