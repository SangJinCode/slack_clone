import React from 'react'
import { createContext, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

//createContext()는 전역적으로 데이터를 공유하기 위한 공간(Context) 을 만드는 함수
const AuthContext = createContext();

//**AuthProvider의 주요 목적은 Context를 통한 데이터 전달이 아니라, axios 인터셉터 설정을 하기 위해 사용]
//**AuthProvider는 “전역 상태 공급자”보다는 “앱이 시작될 때 한 번 실행되어야 하는 초기 설정용 컴포넌트” 역할
//**app이 렌더링되기 전에 axios 인터셉터가 이미 설정돼 있어서 모든 API 요청에 자동으로 토큰을 붙인다.
export default function AuthProvider({ children }) {
    //세션 스토리지에서 현재 로그인한 사용자의 JWT 토큰을 가져오는 역할
    const { getToken } = useAuth();

    useEffect(() => {
        //요청 인터셉터(request interceptor)를 설정하여 모든 axios 요청이 서버로 가기 전에 이 로직을 먼저 거치게 한다.
        const interceptor = axiosInstance.interceptors.request.use(
            //config는 Axios에서 요청을 보낼 때 사용하는 모든 옵션을 포함
            async (config) => {
                try {
                    // clerk에서 토큰을 가져와 Axios에서 요청을 보낼 때 사용하는 config 내부의 Authorization 헤더에 붙여줌
                    const token = await getToken();
                    if (token) config.headers.Authorization = `Bearer ${token}`;
                } catch (error) {
                    if (error.message?.includes("auth") || error.message?.includes("topken")) {
                        toast.error("Authentication issue. Please refresh the page.");
                    }
                    console.log("Error getting token:", error)
                }
                //Authorization 헤더에 값이 추가된 config 반환
                return config;
            },
            (error) => {
                console.error("Axios request error:", error);
                return Promise.reject(error);
            }
        );
        //cleanup 함수는 useEffect()가 언마운트될 때 또는 deps(여기서는 getToken) 변경 시 자동으로 호출
        //즉, 사용자가 페이지를 떠나거나, React 앱 자체가 종료될 때만 언마운트
        //eject()은 등록된 인터셉터를 제거(remove)하는 함수
        return () => axiosInstance.interceptors.request.eject(interceptor);
    }, [getToken])

    //Context를 통해, 하위 컴포넌트들에게 데이터를 전역적으로 전달할 수 있음, value={{}}는 Context로 전달할 값(value)을 지정
    return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>
}
