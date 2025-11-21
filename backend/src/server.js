import "../instrument.mjs";
import express from "express";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js"
import { clerkMiddleware } from "@clerk/express";
import { functions, inngest} from "./config/inngest.js"
import { serve } from "inngest/express";
import chatRoutes from "./routes/chat.route.js"

import cors from "cors";

import * as Sentry from "@sentry/node";

const app = express();

app.use(express.json()); //req.body
app.use(cors({origin:ENV.CLIENT_URL, credentials: true}));
app.use(clerkMiddleware()) //인증 토큰 확인 후 req.auth 같은 인증 정보를 추가하는 미들웨어가 체인에 등록됨.

app.get("/debug-sentry", (req, res) => {
    throw new Error("My first Sentry error!");
})

app.get("/", (req, res) => {
    res.send("Hello");
});

///api/inngest 경로에 serve(...) 미들웨어를 붙여
//Inngest 서버가 이 URL을 호출하면 → 등록된 함수(functions) 중 맞는 걸 실행
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);

Sentry.setupExpressErrorHandler(app);

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


