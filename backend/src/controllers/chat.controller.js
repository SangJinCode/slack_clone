import { generateStreamToken } from "../config/stream.js";

export const getStreamToken = async (req, res) => {
    try {
        const token = generateStreamToken(req.auth().userId);
        res.status(200).json({token}); //{ token: "문자열" } 형태의 JSON 응답
    } catch (error) {
        console.log("Error generating Stream token:", error)
        res.status(500).json({
            message: "Failed to generate Stream token",
        });
    }
};