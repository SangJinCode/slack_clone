import { generateStreamToken } from "../config/stream.js";

//Stream 라이브러리(예: 채팅, 영상 스트리밍 API 등)와 통신하기 위해 필요한 인증 토큰을 생성하여 res에 추가 후 반환
export const getStreamToken = async (req, res) => {
    try {
        console.log("Start getting token")
        const token = await generateStreamToken(req.auth().userId);
        console.log("token in controller", token)
        res.status(200).json({token}); //{ token: "문자열" } 형태의 JSON 응답
    } catch (error) {
        console.log("Error generating Stream token:", error)
        res.status(500).json({
            message: "Failed to generate Stream token",
        });
    }
};