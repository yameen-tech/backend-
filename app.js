const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");
const path = require('path');

const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");

const app = express();

// Update CORS configuration to allow your frontend origin
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4176",
  "http://localhost:5174",   // <-- add this
  "http://localhost:3000",
  "https://effortless-sable-a8baaa.netlify.app" // <-- remove trailing slash
];



app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;