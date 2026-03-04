import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4
    });
    // MongoDB connected silently
  } catch (error) {
    // Silent error - server continues without database
    // Don't exit - let server start anyway
  }
};

export default connectDB;