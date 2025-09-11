const Product = require("../models/Product");
const fs = require('fs');
const path = require('path');

exports.createProduct = async (req, res, next) => {
  try {
    // Extract product data from request body
    const productData = { ...req.body };
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.filename);
    }
    
    // Convert string values to appropriate types
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.originalPrice) productData.originalPrice = parseFloat(productData.originalPrice);
    if (productData.stock) productData.stock = parseInt(productData.stock);
    if (productData.rating) productData.rating = parseFloat(productData.rating);
    if (productData.reviewsCount) productData.reviewsCount = parseInt(productData.reviewsCount);
    if (productData.isNew) productData.isNew = productData.isNew === 'true';
    
    // Handle sizes array if it exists
    if (req.body.sizes) {
      if (Array.isArray(req.body.sizes)) {
        productData.sizes = req.body.sizes;
      } else if (typeof req.body.sizes === 'string') {
        try {
          productData.sizes = JSON.parse(req.body.sizes);
        } catch (e) {
          productData.sizes = [req.body.sizes];
        }
      }
    }
    
    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (err) { 
    // Clean up uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    next(err); 
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate("category");
    
    // Add full image URLs to each product
    const productsWithImageUrls = products.map(product => {
      const productObj = product.toObject();
      if (productObj.images && productObj.images.length > 0) {
        productObj.images = productObj.images.map(image => 
          `/uploads/${image}`
        );
      }
      return productObj;
    });
    
    res.json(productsWithImageUrls);
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    // Add full image URLs
    const productObj = product.toObject();
    if (productObj.images && productObj.images.length > 0) {
      productObj.images = productObj.images.map(image => `/uploads/${image}`);
    }
    
    res.json(productObj);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    
    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.filename);
      
      // Delete old images if new ones are uploaded
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.images && oldProduct.images.length > 0) {
        oldProduct.images.forEach(image => {
          const imagePath = path.join(__dirname, '../uploads', image);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        });
      }
    }
    
    // Convert string values to appropriate types
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.originalPrice) productData.originalPrice = parseFloat(productData.originalPrice);
    if (productData.stock) productData.stock = parseInt(productData.stock);
    if (productData.rating) productData.rating = parseFloat(productData.rating);
    if (productData.reviewsCount) productData.reviewsCount = parseInt(productData.reviewsCount);
    if (productData.isNew) productData.isNew = productData.isNew === 'true';
    
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      productData, 
      { new: true }
    ).populate("category");
    
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    // Add full image URLs
    const productObj = product.toObject();
    if (productObj.images && productObj.images.length > 0) {
      productObj.images = productObj.images.map(image => `/uploads/${image}`);
    }
    
    res.json(productObj);
  } catch (err) {
    // Clean up uploaded files if there was an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    next(err);
  }
};

// ADD THIS DELETE FUNCTION
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Delete associated images from the uploads folder
    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        const imagePath = path.join(__dirname, '../uploads', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }
    
    // Delete the product from the database
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
};