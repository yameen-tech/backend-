// controllers/categoryController.js
const Category = require("../models/Category");

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (requires auth)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image, isActive } = req.body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: "Category name is required" 
      });
    }

    // Check if category with same name already exists (case insensitive)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false,
        message: "Category with this name already exists" 
      });
    }

    // Create category
    const categoryData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      image: image ? image.trim() : '',
      isActive: isActive !== undefined ? isActive : true
    };

    const category = await Category.create(categoryData);
    
    console.log("✅ Category created successfully:", category.name);
    
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category
    });
  } catch (err) {
    console.error("❌ Error creating category:", err);
    
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists"
      });
    }

    next(err);
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    // Get query parameters for filtering/sorting
    const { active, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build filter object
    let filter = {};
    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const categories = await Category.find(filter).sort(sortObj);
    
    console.log(`📋 Fetched ${categories.length} categories`);
    
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    console.error("❌ Error fetching categories:", err);
    next(err);
  }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format"
      });
    }

    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }
    
    console.log(`📋 Fetched category: ${category.name}`);
    
    res.json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error("❌ Error fetching category:", err);
    next(err);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (requires auth)
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive } = req.body;

    console.log(`🔄 Updating category ${id} with data:`, req.body);

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format"
      });
    }

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: "Category name is required" 
      });
    }

    // Check if another category with same name exists (excluding current one)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: id }
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false,
        message: "Another category with this name already exists" 
      });
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      image: image ? image.trim() : '',
      isActive: isActive !== undefined ? isActive : true
    };

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validations
      }
    );

    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }

    console.log(`✅ Category updated successfully: ${category.name}`);
    
    res.json({
      success: true,
      message: "Category updated successfully",
      data: category
    });
  } catch (err) {
    console.error("❌ Error updating category:", err);
    
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists"
      });
    }

    next(err);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (requires auth)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Deleting category: ${id}`);

    // Validate MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format"
      });
    }

    // Check if category exists first
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }

    // TODO: Check if category is being used by any products
    // Uncomment and adjust this if you have a Product model
    /*
    const Product = require("../models/Product");
    const productsUsingCategory = await Product.countDocuments({ category: id });
    if (productsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productsUsingCategory} products are using this category.`
      });
    }
    */

    const category = await Category.findByIdAndDelete(id);

    console.log(`✅ Category deleted successfully: ${existingCategory.name}`);
    
    res.json({ 
      success: true,
      message: "Category deleted successfully",
      data: {
        deletedCategory: category
      }
    });
  } catch (err) {
    console.error("❌ Error deleting category:", err);
    next(err);
  }
};