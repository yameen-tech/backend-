require('dotenv').config(); // MUST be first line

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express(); // ← app is defined here

// Connect to database
connectDB();

// ✅ ALLOW ALL ORIGINS - Simplified CORS configuration
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    allowedOrigins: 'ALL (CORS enabled for all domains)'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.status(200).json({ 
    status: 'OK', 
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    cors: 'Enabled for all origins'
  });
});

// ✅ DEBUG ROUTES - Add them AFTER app is defined
app.get('/api/debug/collections', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📁 Available collections:', collectionNames);
    
    res.json({
      database: db.databaseName,
      collections: collectionNames
    });
  } catch (error) {
    console.error('Collections debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/products-count', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const count = await db.collection('products').countDocuments();
    console.log('📊 Products count:', count);
    
    // Get first few products to check structure
    const sampleProducts = await db.collection('products').find({}).limit(3).toArray();
    
    res.json({
      count: count,
      sampleProducts: sampleProducts
    });
  } catch (error) {
    console.error('Products count debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/categories-count', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    
    const count = await db.collection('categories').countDocuments();
    console.log('📊 Categories count:', count);
    
    // Get first few categories to check structure
    const sampleCategories = await db.collection('categories').find({}).limit(3).toArray();
    
    res.json({
      count: count,
      sampleCategories: sampleCategories
    });
  } catch (error) {
    console.error('Categories count debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS: Enabled for ALL origins`);
  console.log(`🔗 Test URL: http://localhost:${PORT}/api/test`);
  console.log(`🐛 Debug routes available:`);
  console.log(`   - http://localhost:${PORT}/api/debug/collections`);
  console.log(`   - http://localhost:${PORT}/api/debug/products-count`);
  console.log(`   - http://localhost:${PORT}/api/debug/categories-count`);
});