import express from "express";
import { ENV } from "./config/env.js";

import cors from "cors";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello");
});

const startServer = async () => {
    try {
        await connectDB();
        
        if (ENV.NODE_ENV !== "production") {
            app.listen(ENV.PORT, () => {
                console.log("Server started on port:", ENV.PORT)
            });
        }
    } catch (error) {
        console.error("Error starting server:", error)
        process.exit(1);
    }
}

startServer();

export default app;


