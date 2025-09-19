const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // Make sure this file exists
const Product = require('../models/Product'); // Your existing Product model

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'noor-fabrics/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit', quality: 'auto' }
    ]
  }
});

// Configure multer with error handling
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 3 // Maximum 3 files
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 File being uploaded:', file.originalname, file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Multer error handling middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per image.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 3 images allowed.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }
  
  console.error('❌ Multer Error:', error);
  next(error);
};

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all products...');
    const products = await Product.find().populate('category').sort({ createdAt: -1 });
    
    console.log(`✅ Found ${products.length} products`);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    console.log('🔍 Fetching product:', req.params.id);
    const product = await Product.findById(req.params.id).populate('category');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    console.log('✅ Product found:', product.name);
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('❌ Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// POST /api/products - Create new product
router.post('/', upload.array('images', 3), handleMulterError, async (req, res) => {
  try {
    console.log('🆕 Creating new product...');
    console.log('📝 Request body:', req.body);
    console.log('📁 Uploaded files:', req.files?.map(f => ({
      originalname: f.originalname,
      path: f.path,
      size: f.size
    })));
    
    const {
      name,
      price,
      originalPrice,
      discount,
      category,
      description,
      material,
      careInstructions,
      stock,
      rating,
      reviewsCount,
      isNew
    } = req.body;

    // Validate required fields
    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    if (!category?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    // Extract sizes from the request body (sizes[0], sizes[1], etc.)
    const sizes = [];
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('sizes[') && req.body[key]?.trim()) {
        sizes.push(req.body[key].trim());
      }
    });

    // Get uploaded image URLs from Cloudinary
    const images = req.files ? req.files.map(file => file.path) : [];
    console.log('🖼️ Image URLs:', images);

    // Prepare product data
    const productData = {
      name: name.trim(),
      price: parseFloat(price),
      originalPrice: originalPrice && !isNaN(parseFloat(originalPrice)) ? parseFloat(originalPrice) : undefined,
      discount: discount?.trim() || '',
      category,
      description: description?.trim() || '',
      material: material?.trim() || '',
      careInstructions: careInstructions?.trim() || '',
      sizes: sizes,
      stock: stock && !isNaN(parseInt(stock)) ? parseInt(stock) : 0,
      rating: rating && !isNaN(parseFloat(rating)) ? parseFloat(rating) : 0,
      reviewsCount: reviewsCount && !isNaN(parseInt(reviewsCount)) ? parseInt(reviewsCount) : 0,
      isNew: isNew === 'true' || isNew === true,
      images
    };

    console.log('💾 Creating product with data:', productData);

    // Create and save the product
    const product = new Product(productData);
    const savedProduct = await product.save();
    
    // Populate category before sending response
    await savedProduct.populate('category');
    
    console.log('✅ Product created successfully:', savedProduct._id);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct
    });
    
  } catch (error) {
    console.error('❌ Product creation error:', error);
    
    // Clean up uploaded images if database save fails
    if (req.files && req.files.length > 0) {
      console.log('🧹 Cleaning up uploaded images due to error...');
      for (const file of req.files) {
        try {
          // Extract public_id from Cloudinary URL to delete the image
          const urlParts = file.path.split('/');
          const publicIdWithExtension = urlParts.slice(-2).join('/'); // folder/filename
          const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove extension
          await cloudinary.uploader.destroy(publicId);
          console.log('🗑️ Cleaned up image:', publicId);
        } catch (cleanupError) {
          console.error('❌ Error cleaning up image:', cleanupError);
        }
      }
    }
    
    // Send appropriate error response
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', upload.array('images', 3), handleMulterError, async (req, res) => {
  try {
    console.log('📝 Updating product:', req.params.id);
    console.log('📝 Request body:', req.body);
    console.log('📁 New files:', req.files?.map(f => ({
      originalname: f.originalname,
      path: f.path,
      size: f.size
    })));

    const productId = req.params.id;
    
    // Check if product exists
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      // Clean up any uploaded files
      if (req.files && req.files.length > 0) {
        console.log('🧹 Cleaning up uploaded images - product not found...');
        for (const file of req.files) {
          try {
            const urlParts = file.path.split('/');
            const publicIdWithExtension = urlParts.slice(-2).join('/');
            const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '');
            await cloudinary.uploader.destroy(publicId);
          } catch (cleanupError) {
            console.error('❌ Error cleaning up image:', cleanupError);
          }
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name,
      price,
      originalPrice,
      discount,
      category,
      description,
      material,
      careInstructions,
      stock,
      rating,
      reviewsCount,
      isNew
    } = req.body;

    // Extract sizes from the request body
    const sizes = [];
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('sizes[') && req.body[key]?.trim()) {
        sizes.push(req.body[key].trim());
      }
    });

    // Extract existing images that should be kept
    const existingImages = [];
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('existingImages[') && req.body[key]) {
        existingImages.push(req.body[key]);
      }
    });

    // Get new uploaded image URLs
    const newImages = req.files ? req.files.map(file => file.path) : [];
    
    // Combine existing and new images
    const allImages = [...existingImages, ...newImages];
    
    console.log('🖼️ Existing images:', existingImages);
    console.log('🖼️ New images:', newImages);
    console.log('🖼️ All images:', allImages);

    // Prepare update data
    const updateData = {
      name: name?.trim() || existingProduct.name,
      price: price && !isNaN(parseFloat(price)) ? parseFloat(price) : existingProduct.price,
      originalPrice: originalPrice && !isNaN(parseFloat(originalPrice)) ? parseFloat(originalPrice) : existingProduct.originalPrice,
      discount: discount !== undefined ? discount.trim() : existingProduct.discount,
      category: category || existingProduct.category,
      description: description !== undefined ? description.trim() : existingProduct.description,
      material: material !== undefined ? material.trim() : existingProduct.material,
      careInstructions: careInstructions !== undefined ? careInstructions.trim() : existingProduct.careInstructions,
      sizes: sizes.length > 0 ? sizes : existingProduct.sizes,
      stock: stock !== undefined && !isNaN(parseInt(stock)) ? parseInt(stock) : existingProduct.stock,
      rating: rating !== undefined && !isNaN(parseFloat(rating)) ? parseFloat(rating) : existingProduct.rating,
      reviewsCount: reviewsCount !== undefined && !isNaN(parseInt(reviewsCount)) ? parseInt(reviewsCount) : existingProduct.reviewsCount,
      isNew: isNew !== undefined ? (isNew === 'true' || isNew === true) : existingProduct.isNew,
      images: allImages
    };

    console.log('💾 Updating with data:', updateData);

    const updatedProduct = await Product.findByIdAndUpdate(
      productId, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('category');
    
    console.log('✅ Product updated successfully:', updatedProduct._id);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
    
  } catch (error) {
    console.error('❌ Product update error:', error);
    
    // Send appropriate error response
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product or category ID'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting product:', req.params.id);
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      console.log('🧹 Deleting images from Cloudinary...');
      for (const imageUrl of product.images) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = imageUrl.split('/');
          const publicIdWithExtension = urlParts.slice(-2).join('/'); // folder/filename
          const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove extension
          await cloudinary.uploader.destroy(publicId);
          console.log('🗑️ Deleted image:', publicId);
        } catch (imageError) {
          console.error('❌ Error deleting image from Cloudinary:', imageError);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);
    
    console.log('✅ Product deleted successfully');
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Product deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

module.exports = router;