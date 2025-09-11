const express = require("express");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");
const path = require("path");

const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");

const app = express();

// ✅ Allowed production origins
const allowedOrigins = [
  "https://effortless-sable-a8baaa.netlify.app" // without trailing slash
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // ✅ Allow any localhost for dev
    if (origin.startsWith("http://localhost")) {
      return callback(null, true);
    }

    // ✅ Allow only whitelisted production origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // ❌ Reject everything else
    return callback(new Error("The CORS policy for this site does not allow access from the specified Origin."), false);
  },
  credentials: true
}));

app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
