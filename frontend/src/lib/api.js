//여기서는 그냥 axiosInstance를 import해서 사용 중요한 점: axiosInstance가 AuthProvider 안에서 세팅된 인터셉터를 그대로 공유합니다.
//즉, AuthProvider 안에서 등록된 토큰 인터셉터가 이미 동작하고 있기 때문에, api.js에서 axiosInstance.get(...)를 호출하면 자동으로 토큰이 포함된 요청이 날아갑니다.

import { axiosInstance } from "./axios";

////Stream 라이브러리(예: 채팅, 영상 스트리밍 API 등)와 통신하기 위해 필요한 인증 토큰을 받오기위한 api 요청
export async function getStreamToken() {
    const response = await axiosInstance.get("/chat/token");
    console.log("response.data",response.data)
    return response.data
}