import React from 'react'
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {

    const {id: callId} = useParams();

    const {user, isLoaded} = useUser();

    //video call에 참가할 유저 객체(유저 정보와 token 포함)
    const [client,setClient] = useState(null);

    //생성된 videocall 
    const [call, setCall] = useState(null);

    const [isConnecting, setIsConnecting] = useState(true)

    //**영상 통화를 위한 stream token을 얻어온다. */
    const {data: tokenData} = useQuery({
        queryKey: ["streamToken"],
        queryFn: getStreamToken,
        enabled: !!user,
    });

    //** 영상 통화 기능 초기화, 유저 로그인 정보나 통화 ID가 준비되었을 때 자동으로 통화 세션을 만들고 연결을 시도 */
    useEffect(() => {
        const initCall = async () => {
            if(!tokenData.token || !user || !callId) return

            try {
                //Stream.io의 비디오 통화 클라이언트 객체를 만든다.
                const videoClient = new StreamVideoClient({
                    apiKey: STREAM_API_KEY,
                    user: {
                        id: user.id,
                        name: user.fullName,
                        image: user.imageUrl,
                    },
                    token: tokenData.token,
                });

                //통화방 타입이 default인 통화방 생성
                const callInstance = videoClient.call("default", callId)

                //통화방에 입장 또는 없으면 새로 생성
                await callInstance.join({ create: true })

                
                setClient(videoClient);
                setCall(callInstance);

            } catch (error) {
                console.log("Error init call:", error);
                toast.error("Cannot connect to the call");
            } finally {
                setIsConnecting(false)
            }
        };

        initCall();
        
    }, [tokenData, user, callId]);

    if (isConnecting || !isLoaded) {
        return <div className="h-screen justify-center items-center">Connecting to call...</div>
    }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="relative w-full max-w-4xl mx-auto">
            {client && call ? (
                <StreamVideo client={client}>
                    <StreamCall call={call}>
                        <CallContent />
                    </StreamCall>
                </StreamVideo>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p>Could not initialize call. Please refresh or try again later</p>
                </div>
            )}
        </div>
    </div>
  )
};

const CallContent = () => {

    //영상통화 상태를 관리하기 위한 hooks
    const { useCallCallingState } = useCallStateHooks();

    //통화의 상태를 리턴
    const callingState = useCallCallingState();

    const navigate = useNavigate();

    //통화가 종료되면 홈으로 보냄
    if (callingState === CallingState.LEFT) return navigate("/");

    return (
        <StreamTheme>
            <SpeakerLayout />
            <CallControls />
        </StreamTheme>
    )
}

export default CallPage;