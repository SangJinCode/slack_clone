import React from 'react'
import { UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useStreamChat } from "../hooks/useStreamChat";
import PageLoader from "../components/PageLoader";

import "../styles/stream-chat-theme.css";
import { HashIcon, PlusIcon, UsersIcon } from "lucide-react";

import CreateChannelModal from "../components/CreateChannelModal";
import CustomChannelPreview from "../components/CustomChannelPreview";
import UsersList from "../components/UsersList";

import {
  Chat,
  Channel,
  ChannelList,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from "stream-chat-react";
import CustomChannelHeader from '../components/CustomChannelHeader';

const HomePage = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    console.log("isCreateModalOpen",isCreateModalOpen)

    //활성화된 채널 정보
    const [activeChannel, setActiveChannel] = useState(null);

    //URL의 쿼리스트링 값을 읽을 수 있는 객체 (URLSearchParams 타입), searchParams은 {key:value}로 저장
    const [searchParams, setSearchParams] = useSearchParams();
    console.log("searchParams in Homepage",searchParams)

    //실제로 서버와 연결된 StreamChat 인스턴스, 커스텀 훅으로 부터 전달
    //chatClient는 StreamChat에 참가한 유저 정보를 포함한 객체
    const { chatClient, error, isLoading } = useStreamChat(); //custom hook

    // set active channel from URL params
    useEffect(() => {
        if (chatClient) {
            const channelId = searchParams.get("channel");

            //url에서 얻는 channelId가 있는 경우 
            if (channelId) {
                //특정 타입 채널과 채널 ID에 해당 채널 정보
                //"messaging" → 채널 타입 (Stream에서 기본 제공되는 1:1, 그룹 채팅용 타입)
                //channelId → 채널의 고유 ID
                const channel = chatClient.channel("messaging", channelId)
                console.log("channel in Homepage.jsx", channel)
                setActiveChannel(channel)
                console.log("activeChannel in Homepage.jsx", activeChannel)
            }
        }
    }, [chatClient, searchParams]);

    if (error) return <p>Something went wrong...</p>;
    if (isLoading || !chatClient) return <PageLoader />

  return (
    <div className="chat-wrapper">
        <Chat client={chatClient}>
            <div className="chat-container">
                {/* LEFT SIDEBAR */}
                <div className="str-chat__channel-list">
                    <div className="team-channel-list">
                        {/* HEADER */}
                        <div className="team-channel-list__header gap-4">
                            <div className="brand-container">
                                <img src="/logo.png" alt="Logo" className='brand-logo' />
                                <span className='brand-name'>Slap</span>
                            </div>
                            <div className="user-button-wrapper">
                                <UserButton />
                            </div>
                        </div>
                        {/* CHANNELS LIST */}
                        <div className="team-channel-list__content">
                            <div className="create-channel-section">
                                <button 
                                    onClick={() => setIsCreateModalOpen(true)} 
                                    className='create-channel-btn'
                                >
                                    <PlusIcon className='size-4' />
                                    <span>Create Channel</span>
                                </button>
                            </div>

                            {/* CHANNEL LIST */}
                            <ChannelList 
                                filters={{ members: {$in: [chatClient?.user?.id]} }}
                                options={{ state: true, watch: true }}
                                Preview={({ channel }) => (
                                    <CustomChannelPreview
                                        channel={channel}
                                        activeChannel={activeChannel}
                                        setActiveChannel={(channel) => setSearchParams({ channel: channel.id})}
                                    />
                                )}
                                List={({ children, loading, error }) => (
                                    <div className='channel-sections'>
                                        <div className='section-header'>
                                            <div className='section-title'>
                                            <HashIcon className='size-4' />
                                            <span>Channels</span>
                                            </div>
                                        </div>

                                        {loading && <div className='loading-message'>Loading channels...</div>}
                                        {error && <div className='error-message'>Error loading channels</div>}

                                        <div className='channels-list'>{children}</div>

                                        <div className='section-header direct-messages'>
                                            <div className='section-title'>
                                                <UsersIcon className="size-4"/>
                                                <span>Direct Messages</span>
                                            </div>
                                        </div>
                                        <UsersList activeChannel={activeChannel} />
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT CONTAINER */}
                <div className="chat-main">
                    <Channel channel={activeChannel}>
                        <Window>
                            <CustomChannelHeader />
                            <MessageList />
                            <MessageInput />
                        </Window>

                        <Thread />

                    </Channel>
                </div>
            </div>
            {isCreateModalOpen && <CreateChannelModal onClose={() => setIsCreateModalOpen(false)} />}
        </Chat>
    </div>
  )
}

export default HomePage