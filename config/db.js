const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Changed from MONGO_URI to MONGODB_URI to match your .env file
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    
    // Additional debugging info
    if (!process.env.MONGODB_URI) {
      console.error("🔍 MONGODB_URI environment variable is not set");
      console.log("Available env vars:", Object.keys(process.env).filter(key => key.includes('MONGO')));
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;