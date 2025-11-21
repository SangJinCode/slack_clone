import React from 'react'
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { useChatContext } from "stream-chat-react";

import * as Sentry from "@sentry/react";
import { CircleIcon } from "lucide-react";

const UsersList = ({ activeChannel }) => {

    //현재 연결된 채팅 클라이언트(client)를 가져온다. client.user에는 현재 로그인한 유저 정보가 들어있다.
    const { client } = useChatContext();

    //URL 쿼리 파라미터를 제어, _는 첫 번째 반환값(현재 searchParams 객체)을 사용하지 않겠다는 의미
    const [_, setSearchParams] = useSearchParams();

    //** 나를 제외한 유저만 담은 배열 반환*/
    //useCallback은 React의 성능 최적화 훅으로, 컴포넌트가 리렌더링될 때마다 fetchUsers 함수가 새로 생성되는 걸 방지
    //client가 바뀌지 않는 한, React는 다음 렌더링에서도 이전의 fetchUsers 함수를 재사용
    const fetchUsers = useCallback( async () => {
        //client?.user가 없으면 아직 Stream에 로그인하지 않은 상태라, 서버 요청을 보내지 않고 함수를 종료
        if (!client?.user) return;

        //client.queryUsers(filter, sort?, options?)
        //1. $ne는 "not equal" (같지 않음) 즉, 현재 로그인한 유저를 제외한 모든 유저 검색
        //2. 이름 기준 오름차순 정렬
        //3. 최대 20명까지만 가져옴
        const response = await client.queryUsers(
            {id: {$ne: client.user.id } },
            {name: 1 },
            { limit: 20 }
        );
        //Stream(Chat, Video) API에서는 "recording-"으로 시작하는 ID를 자동으로 생성해서 녹화용 가상 유저(bot)로 사용, 
        //"recording-"을 포함하지 않은 유저만 필터링
        const usersOnly = response.users.filter((user) => !user.id.startsWith("recording-"))

        return usersOnly

    },[client])

    //**위에 fetchUser는 랜더마다 새로운 참조를 가지게 되어 useQuery는 새로운 함수로 인식 할 수 있음 그래서 위 함수를 useCallback으로 감싼다.
    //결국 enabled 조건을 주어도 실행하는 함수는 useCallback으로 감싸야한다.
    const { 
        data: users = [], //data를 users라는 이름으로 바꾸고, undefined일 경우 빈 배열 []을 기본값으로 줘서 안전하게 쓰려는 것
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["users-list", client?.user?.id], //client.user.id가 다르면 다른 사용자로 로그인한 것으로 판단하고, 새로운 데이터를 다시 불러와 캐쉬에 추가한다.
        queryFn: fetchUsers,
        enabled: !!client?.user, //client?.user가 존재할 때만 fetchUsers를 실행
        staleTime: 1000 * 60 * 5, // 신선한(fresh)” 상태로 유지할 시간(밀리초 단위) 5 mins
    });

    //**Stream Chat에서 “1:1 DM(Direct Message)” 채널을 만들고 열기 위한  함수
    const startDirectMessage = async ( targetUser ) => {
        if (!targetUser || !client?.user) return;

        try {
            //client.user.id, targetUser.id를 이용해 channelId 생성
            //sort()-두 아이디를 사전순으로 정렬, slice(0,64)-앞에서부터 64자까지만 사용
            const channelId = [client.user.id, targetUser.id].sort().join("-").slice(0,64);

            //client.user.id, targetUser.id를 멤버로 하는 channel을 불러오거나 없으면 새로 생성
            const channel=client.channel("messageing", channelId, {
                members: [client.user.id, targetUser.id],
            });

            //서버에 "이 채널의 이벤트(메시지, 멤버 변화 등)를 실시간으로 받고 싶다"고 알리고 받게됨
            await channel.watch();

            //React 앱이 다시 로드될 때 URL을 확인하고(useSearchParams 또는 useLocation),그 안의 channel 값을 읽어서
            //같은 채널을 다시 불러오는 로직이 실행됩니다.
            setSearchParams({ channel: channel.id }) ///home?channel=user1-user2

        } catch (error) {
            console.log("Error creating DM", error),
            Sentry.captureException(error, {
                tags: { component: "UsersList"},
                extra: {
                    context: "create_direct_message",
                    targetUserId: targetUser?.Id
                },
            });
        }
    };

    if (isLoading) return <div className="">Loading users...</div>
    if (isError) return <div className="">Failed to load users</div>
    if (!users.length) return <div className="">No other users found</div>

  return (
    <div className="team-channel-list__users">
        {users.map((user) => {
            //sort()-두 아이디를 사전순으로 정렬,slice(0,64)-앞에서부터 64자까지만 사용
            const channelId = [client.user.id, user.id].sort().join("-").slice(0,64);

            //새로운 채널을 만들거나,이미 존재하는 채널을 참조(불러오기) 하는 역할  
            const channel = client.channel("messaging", channelId, {
                members: [client.user.id, user.id],
            });

            //재 사용자가 해당 채널에서 아직 읽지 않은 메시지 개수를 계산
            const unreadCount = channel.countUnread();
            
            //activeChannel이 존재하고,그 채널의 id가 지금 렌더링 중인 channelId랑 같으면 isActive를 true로.
            const isActive = activeChannel && activeChannel.id === channelId;
            
            return (
                <button
                    key={user.id}
                    onClick={() => startDirectMessage(user)}
                    className={`str-chat__channel-preview-messenger ${
                        isActive && "!bg-black/20 !hover:bg-black/20 border-l-8 border-purple-500 shadow-lg0"
                    }`}    
                >
                    <div className='flex items-center gap-2 w-full'>
                        <div className='relative'>
                            {user.image ? (
                                <img 
                                    src={user.image}
                                    alt={user.name || user.id}
                                    className='w-4 h-4 rounded-full'
                                />
                            ) : (
                                <div className='w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center'>
                                    <span className='text-xs text-white'>
                                        {(user.name || user.id).charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            <CircleIcon 
                                className={`w-2 h-2 absolute -bottom-0.5 -right-0.5 ${
                                    user.online ? "text-green-500 fill-green-500" : "text-gray-400 fill-gray-400"
                                }`}
                            />
                        </div>

                        <span className='str-chat__channel-preview-messenger-name truncate'>
                            {user.name || user.id}
                        </span>

                        {unreadCount > 0 && (
                            <span className='flex items-center justify-center ml-2 size-4 text-xs rounded-full bg-red-500'>
                                {unreadCount}
                            </span>
                        )}
                    </div>
                </button>
            );
        })}
    </div>
  )
}

export default UsersList;