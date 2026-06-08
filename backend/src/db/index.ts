import mongoose from "mongoose";
import config from "../config/config.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb_uri);

    //listening to db
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB Disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB Reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error: any | { message: string }) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit on failure — letting process manager restart
  }
};

export default connectDB;
