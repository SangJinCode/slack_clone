import React from 'react'
import { HashIcon, LockIcon, UsersIcon, PinIcon, VideoIcon } from "lucide-react";
import { useChannelStateContext } from "stream-chat-react";
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import MembersModal from "./MembersModal";
import PinnedMessagesModal from "./PinnedMessagesModal";
import InviteModal from "./InviteModal";

const CustomChannelHeader = () => {
    //현재 선택된 채널의 상태(context) 를 가져온다.
    const { channel } = useChannelStateContext();

    //로그인된 유저 정보
    const { user } = useUser()

    //Object.keys()는 객체의 key(속성 이름) 들만 뽑아서 배열로 반환
    const memberCount = Object.keys(channel.state.members).length;

    const [showInvite, setShowInvite] = useState(false);

    const [showMembers, setShowMembers] = useState(false);

    const [showPinnedMessages, setShowPinnedMessages] = useState(false);

    const [pinnedMessages, setPinnedMessages] = useState([]);
    console.log("***pinned_messages***",pinnedMessages)
    
    //Object.values()의 결과 "user_1": { user: { id: "user_1", name: "Alice" } }, -> { user: { id: "user_1", name: "Alice" } },
    //채널에 참석한 유저 중 내가 아닌 다른 유저를 찾는다.
    const otherUser = Object.values(channel.state.members).find(
        (member) => member.user.id !== user.id
    );

    //DM인지 확인, member_count === 2 → 이 채널에 2명만 존재한다는 뜻, "user_"라는 문자열이 포함되어 있는지 확인
    const isDM = channel.data?.member_count === 2 && channel.data?.id.includes("user_")

    //**pinnedMessages에 값을 할당하고 showPinnedMessages의 값을 true로 변경하여 pinnedMessages를 표시한다.
    const handleShowPinned = async () => {
        //메시지, 멤버, 고정 메시지 등 채널에 대한 정보를 서버에서 받아온다.
        const channelState = await channel.query();
        console.log("***channelState.pinned_messages***",channelState.pinned_messages)

        //channelState 안에 들어 있는 pinned_messages 배열(즉, 고정된 메시지들)을 state로 저장
        setPinnedMessages(channelState.pinned_messages)

        setShowPinnedMessages(true)
    }

    //*videocall url 생성 후 채널에 참가한 유저에게 전송
    const handleVideoCall = async () => {
        if (channel) {
            //현재 웹사이트(window.location.origin)주소와 channel.id를 사용해 통화방 링크 생성
            const callUrl = `${window.location.origin}/call/${channel.id}`;

            //서버로 메시지 전송 요청이 가고, 채널에 속한 모든 멤버가 이 메시지를 받을 수 있게 된다.
            await channel.sendMessage({
                text: `I've started a video call. Join me here: ${callUrl}`,
            });
        }
    }

  return (
    <div className="h-14 border-b border-gary-200 flex items-center px-4 justify-between bg-white">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">

                {/* 채널 타입에따라 icon 적용 */}
                {channel.data?.private ? (
                    <LockIcon className='size-4 text-[#616061]' />
                ) : (
                    <HashIcon className='size-4 text-[#616061]' />
                )}

                {/* DM 이고 유저 정보에 이미지를 포함하고 있으면 img 표시 */}
                {isDM && otherUser?.user?.image && (
                    <img 
                        src={otherUser.user.image}
                        alt={otherUser.user.name || otherUser.user.id}
                        className='size-7 rounded-full object-cover mr-1'
                    />
                )}

                {/* isDM이 true일때 otherUser?.user?.name이 있으면 표시하고 없으면 otherUser?.user?.id를 표시
                isDM이 false일때 channel.data?.id 표시 */}
                <span className='font-medium text-[#1D1C1D'>
                    {isDM ? otherUser?.user?.name || otherUser?.user?.id : channel.data?.id}
                </span>
            </div>
        </div>

        <div className="flex items-center gap-3">
            {/* setShowMembers(true)으로 설정해 MembersModal 표시 */}
            <button
                className='flex items-center gap-2 hover:bg-[#F8F8F8] py-1 px-2 rounded'
                onClick={() => setShowMembers(true)}
            >
                <UsersIcon className='size-5 text-[#616061]' />
                <span className="text-sm text-[#616061]">{memberCount}</span>
            </button>

            {/* 클릭시 handleVideoCall함수 실행 */}
            <button
                className='hover:bg-[#F8F8F8] p-1 rounded'
                onClick={handleVideoCall}
                title="Start Video Call"
            >
                <VideoIcon className='size-5 text-[#1264A3]' />
            </button>

            {/* setShowInvite(true)으로 설정해 InviteModal 표시 */}
            {channel.data?.private && (
                <button className='btn btn-primary' onClick={() => setShowInvite(true)}>
                    Invite
                </button>
            )}

            {/* 클릭시 handleShowPinned 함수 실행 */}
            <button className='hover:bg-[#F8F8F8] p-1 rounded' onClick={handleShowPinned}>
                <PinIcon className='size-4 text-[#616061]' />
            </button>
        </div>
        
        {/* showMembers가 true이면 MembersModal 표시한다.  */}
        {showMembers && (
            //map()을 사용하기 위해 객체인 channel.state.members를 배열로 변환
            <MembersModal 
                members={Object.values(channel.state.members)}
                onClose={() => setShowMembers(false)}
            />
        )}

        {/* showPinnedMessages가 true이면 PinnedMessagesModal 표시한다.  */}
        {showPinnedMessages && (
            <PinnedMessagesModal 
                pinnedMessages={pinnedMessages}
                onClose={() => setShowPinnedMessages(false)}
            />
        )}

        {/* showInvite가 true이면 InviteModal 표시한다.  */}
        {showInvite && <InviteModal channel={channel} onClose={() => setShowInvite(false)} />}
    </div>
  );
};

export default CustomChannelHeader;