const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: Number,
  originalPrice: Number,
  discount: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  images: [String],
  description: String,
  material: String,
  careInstructions: String,
  sizes: [String],
  stock: Number,
  rating: Number,
  reviewsCount: Number,
  isNew: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Product", ProductSchema);
