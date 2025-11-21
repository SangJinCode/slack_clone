import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDB = async () => {
    try {
        console.log("Connecting DB")
        const conn = await mongoose.connect(ENV.MONGO_URI);

        console.log("MongoDB connected successfully:", conn.connection.host)
    } catch (error) {
        console.log("Error connecting to MongoDB:", error)
        process.exit(1)
    }
}