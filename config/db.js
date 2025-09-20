const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'test' // ← Explicitly specify the database name
    });
    
    console.log("✅ MongoDB Connected Successfully");
    console.log(`📊 Connected to database: ${mongoose.connection.db.databaseName}`);
    
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;