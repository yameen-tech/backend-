require('dotenv').config(); // MUST be first line

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Your existing db.js

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://effortless-sable-a8baaa.netlify.app',
    'https://noorfabrics.co.in'
  ], // Add your frontend URLs
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));

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
  console.log(`🌐 Allowed origins:`, [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://effortless-sable-a8baaa.netlify.app',
    'https://noorfabrics.co.in'
  ]);
});