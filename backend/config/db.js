import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log("✅ MongoDB Connected successfully");
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // Don't exit - let server start anyway
  }
};

export default connectDB;