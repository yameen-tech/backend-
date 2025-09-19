const Product = require("../models/Product");
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'products',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    
    uploadStream.end(buffer);
  });
};

exports.createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    
    // Handle uploaded images - upload to Cloudinary
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        imageUrls.push(result.secure_url);
      }
      productData.images = imageUrls;
    }
    
    // Convert string values to appropriate types
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.originalPrice) productData.originalPrice = parseFloat(productData.originalPrice);
    if (productData.stock) productData.stock = parseInt(productData.stock);
    if (productData.rating) productData.rating = parseFloat(productData.rating);
    if (productData.reviewsCount) productData.reviewsCount = parseInt(productData.reviewsCount);
    if (productData.isNew) productData.isNew = productData.isNew === 'true';
    
    // Handle sizes array
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
    next(err); 
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate("category");
    res.json(products);
  } catch (err) { 
    next(err); 
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    
    // Handle uploaded images - upload new ones to Cloudinary
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        imageUrls.push(result.secure_url);
      }
      productData.images = imageUrls;
      
      // Note: Old Cloudinary images will remain (they don't auto-delete)
      // You could implement deletion if needed using cloudinary.uploader.destroy()
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
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Note: Cloudinary images won't be automatically deleted
    // You could implement deletion using cloudinary.uploader.destroy() if needed
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
};