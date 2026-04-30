import mongoose from "mongoose";
import dataMode, { isMongoMode } from "./dataMode.js";

const connectDB = async () => {
  if (!isMongoMode) {
    console.log(`Data mode: ${dataMode}. Using local file storage.`);
    return;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
