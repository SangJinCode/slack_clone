import { useState, useEffect } from "react";
import { StreamChat } from "stream-chat";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import * as Sentry from "@sentry/react";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export const useStreamChat = () => {

    const { user } = useUser();
    console.log("user.id from Clerk", user.id)

    //StreamChat에 참여한 client 정보를 전달하기 위한 state
    //Stream Chat SDK의 클라이언트 인스턴스 (즉, 현재 로그인된 유저의 연결 객체)
    const [chatClient, setChatClient] = useState(null)

    //** stream token을 받아오는 함수 실행
    const {
        data: tokenData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["streamToken"], //캐쉬 식별자
        queryFn: getStreamToken, //실행될 실제 데이터 요청 함수
        //user.id가 true일때만 useQuery실행 ,
        //컴포넌트가 처음 렌더링될 때 user가 아직 안 들어왔는데 fetchProfile(undefined)를 호출해서 에러가 발생하는 것을 방지 😵
        enabled: !!user?.id, 
    })

   console.log("Stream_tokenData.token:", tokenData?.token);

    useEffect(() => {
        if (!tokenData?.token || !user?.id || !STREAM_API_KEY) return;

        //채팅 클라이언트 인스턴스 생성, client는 “채팅 서버와 연결할 준비는 됐지만, 로그인된 사용자는 없음” 상태
        const client = StreamChat.getInstance(STREAM_API_KEY);

        let cancelled = false;

        const connect = async () => {
            try {
                //Stream 서버에 “이 사용자가 접속했어”라고 인증하고, 실시간 WebSocket 연결을 맺는 함수
                await client.connectUser(
                    {
                        id: user.id,

                        //??는 앞의 값이 null이나 undefined일 경우에만 뒤의 값을 사용
                        name: user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? user.id,
                        
                        image: user.imageUrl ?? undefined,
                    },
                    tokenData.token
                );

                //cancelled가 true이면 client를 state로 저장 즉 컴포넌트가 살아있으면 실행하고 아니면 업데이트 중지 
                if (!cancelled ) {
                    setChatClient(client);
                    console.log("chatClient in useStreamChat", chatClient)
                }

            } catch (error) {
                console.log("Error connecting to stream", error);
                Sentry.captureException(error, {
                    tags: { component: "useStreamChat" },
                    extra: {
                        context: "stream_chat_connection",
                        userId: user?.id,
                        streamApiKey: STREAM_API_KEY ? "present" : "missing",
                    },
                })
            }
        };

        connect()
        console.log("completed connection")

        //useStreamChat()을 호출한 컴포넌트가 언마운트될때 작동
        //cleanup 함수로 cancelled를 true로 변경하여 setChatClient()의 실행을 막고 
        //Stream Chat 클라이언트에서 현재 로그인된 사용자의 연결을 종료
        return () => {
            cancelled = true;
            client.disconnectUser();
        };
    }, [tokenData?.token, user?.id])

    return {chatClient, isLoading, error}
}