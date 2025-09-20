const express = require("express");
const { 
  createCategory, 
  getCategories,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");
const auth = require("../middlewares/auth");

const router = express.Router();

// GET all categories
router.get("/", getCategories);

// POST create new category (protected)
router.post("/", auth, createCategory);

// PUT update category (protected)
router.put("/:id", auth, updateCategory);

// DELETE category (protected)
router.delete("/:id", auth, deleteCategory);

module.exports = router;