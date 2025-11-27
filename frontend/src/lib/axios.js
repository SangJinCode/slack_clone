import axios from "axios"

// const BASE_URL = import.meta.env.MODE === 'development'
//     ? 'http://localhost:5001/api' : 'https://slack-clone-gamma-gules.vercel.app/api'

const BASE_URL = import .meta.env.VITE_API_BASE_URL

// axios 인스턴스 생성
export const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // 요청 시 쿠키/세션 정보도 함께 전송
})