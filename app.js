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
  "https://effortless-sable-a8baaa.netlify.app",
  "https://noorfabrics.co.in" // new origin added
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // ✅ Allow localhost during dev
    if (origin.startsWith("http://localhost")) {
      return callback(null, true);
    }

    // ✅ Allow only whitelisted origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // ❌ Reject everything else
    return callback(new Error("CORS not allowed from this origin"), false);
  },
  credentials: true
}));

app.use(express.json());

// ✅ Serve static images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

// Error handling
app.use(errorHandler);





module.exports = app;
