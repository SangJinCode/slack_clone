import React from 'react'
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useChatContext } from "stream-chat-react";
import * as Sentry from "@sentry/react";
import toast from "react-hot-toast";
import { AlertCircleIcon, HashIcon, LockIcon, UsersIcon, XIcon } from "lucide-react";

const CreateChannelModal = ({ onClose }) => {

    //input입력된 channelName
    const [channelName, setChannelName] = useState("");

    const [channelType, setChannelType] = useState("public");

    const [description, setDescription] = useState("");

    const [isCreating, setIsCreating] = useState(false);

    const [error, setError] = useState("");

    //로그인된 유저를 제외한 유저
    const [users, setUsers] = useState([]); 
    
    //users에서 id만 담고 있는 배열
    const [selectedMembers, setSelectedMembers] = useState([]);

    const [loadingUsers, setLoadingUsers] = useState(false);

    const [_, setSearchParams] = useSearchParams();

    //client는 컴스텀 훅인 useStreamChat.js가 반환하는 chatClient를 Chat(HomePage.jsx) 컴포넌트로부터 하위 컴포넌트로 주입된 동일한 StreamChat 인스턴스
    //현재 채팅 상태(context)에 접근하여 로그인된 Stream Chat 클라이언트 (client), 현재 활성화된 채널 정보 (activeChannel)
    const { client, setActiveChannel } = useChatContext();
    console.log("client.user.id in create modal", client.user.id)
    console.log("client in create modal", client)
    console.log("setActiveChannel in create modal", setActiveChannel)
    //***Stream 서버로부터 recording- 시작하지 않는 유저 중 로그인된 유저(client.user.id)를 제외한 유저만 배열(users)로 반환 
    useEffect(() => {
        const fetchUsers = async () => {
            
            //client에 user에 해당하는 정보가 없으면 중지
            if (!client?.user) return;
            setLoadingUsers(true);
        

            try {
                //client(로그인된 유저) 정보를 이용해 Stream 서버로 부터 현재 로그인되 유저를 제외한 유저 정보를 받아온다.
                const response = await client.queryUsers(
                    { id: { $ne: client.user.id } },
                    { name: 1 },
                    { limit: 100}
                );

                console.log("response in create modal", response)

                //배열을 순회하면서 조건을 만족하는 요소만 남긴 새로운 배열을 반환
                //"recording-"으로 시작하지 않는 경우만 남기겠다는 뜻
                //녹화용/시스템용 계정(recording-로 시작하는 ID) 은 제외
                const usersOnly = response.users.filter((user) => !user.id.startsWith("recording-"))

                //왼쪽 값이 falsy(거짓)일 때 오른쪽 값을 대신 사용합
                setUsers(usersOnly || [])

            } catch (error) {
                console.log("Error fetching users", error)
                Sentry.captureException(error, {
                    tsgs: { component: "CreateChannelModal" },
                    extra: { context: "fetch_users_for_channel"},
                });
                setUsers([])
            } finally {
                setLoadingUsers(false);
            }
        }
        fetchUsers();
    }, [client]);

    //***public 타입의 채널이면 users에서 id 값만 추출한 새로운 배열을 selectedMembers의 값으로 대입
    useEffect(() => {
        if (channelType === "public") setSelectedMembers(users.map((u) => u.id))
        else setSelectedMembers([])
    }, [channelType, users])

    //***name을 validate하는 함수
    const validateChannelName = (name) => {
        if (!name.trim()) return "Channel name is required"; //“입력값이 없거나 공백뿐이면” 이 조건이 true가된다.
        if (name.length < 3) return "Channel name must be at least 3 characters";
        if (name.length > 22) return "Channel name must be less than 22 characters";

        return ""
    }

    //***입력된 channel name을 channelName에 대입하고 검증 후 에러가 발생하면 error의 state값으로 대입하는 함수
    const handleChannelNameChange = (e) => {
        const value = e.target.value
        setChannelName(value)
        setError(validateChannelName(value))
    }

    //***함수로 전달된 id가 selectedMembers에 존재하면 해당 id를 제외한 id만 담은 배열을 반환, 없으면 selectedMembers에 추가
    //즉 check 박스 사용시 기존 배열에 id가 존재하면 이미 체크된 것이므로 unchecked하는 효과를 구현히기 위해 배열에서 해당 id를 삭제
    const handleMemberToggle = (id) => {
        //id가 배열에 존재하면 id와 다른 것만 배열에 남긴다. 즉 이미 존재하면 제거, 제거 버튼 처리 로직
        if (selectedMembers.includes(id)) {
            setSelectedMembers(selectedMembers.filter((uid) => uid !== id))
        } else {
            //배열에 존재하지 않으면 추가
            setSelectedMembers([...selectedMembers, id])
        }
    }

    //** form submit을 처리하는 함수
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateChannelName(channelName)
        if (validationError) return setError(validationError)
        
        if (isCreating || !client?.user) return

        setIsCreating (true)
        //검증이 통과되면 ""를 반환, 화면에는 여전히 이전 에러 메시지가 남아 있을 수 있기 때문에 에러 메세지 초기화
        setError("");

        try {
            //channelID 생성, channelName을 사용 함, MY COOL CHANNEL !#1 => my-cool-channel-1
            const channelId = channelName
                .toLowerCase()
                .trim()
                .replace(/\s+/g,"-") //공백(띄어쓰기, 탭 등)을 모두 -(하이픈)으로 바꾸기
                .replace(/[^a-z0-9-_]/g, "")//^는 “이것을 제외한 문자” 의미, 허용되는 문자: 소문자(a-z), 숫자(0-9), -, _
                .slice(0, 20)

            //channelData 생성, channelName, client.user.id 사용
            const channelData = {
                name:channelName.trim(),
                created_by_id: client.user.id,
                members: [client.user.id, ...selectedMembers],
            };

            //description이 존재하면 channelData에 해당 속성 추가
            if (description) channelData.description = description;

            //channelType이 "private"이면 channelData에 private과 visibility 값을 변경
            if (channelType === "private") {
                channelData.private = true;
                channelData.visibility = "private";
            } else {
                channelData.visibility = "public";
                channelData.discoverable = true;
            }

            //존재하면 채널을 가져오거나 없으면 새로 생성하는 메서드
            const channel = client.channel("messaging", channelId, channelData)

            //이 채널의 변화를 실시간으로 보겠다
            await channel.watch()

            //생성된 채널을 stream 서버에 activeChannel에 등록하고 이후 const channel은 해당 채널을 다시 불러와 새로고침 같은 이벤트 발생시 
            //기존 채널을 다시 불러온다.
            setActiveChannel(channel)

            //지금 새로 만든 채널을 URL에 표시하고, HomePage.jsx에서 새로고침 하거나 링크를 복사한경우 searchParams.get("channel")을
            //사용해 channelId를 불러와 activeChannel의 state 값으로 불러온다.
            setSearchParams({ channel: channelId })

            toast.success(`Channel "${channelName}" created successfully!`)

            //HomePage.jsx에서 전달된 setIsCreateModalOpen(false)를 실행해서 모달창 닫기
            onClose()
        } catch (error) {
            console.log("Error creating the channel", error)
        } finally {
            setIsCreating(false)
        }
    }

    
  return (
    <div className="create-channel-modal-overlay">
        <div className="create-channel-modal">
            <div className="create-channel-modal__header">
                <h2>Create a channel</h2>
                <button onClick={onClose} className='create-channel-modal__close'>
                    <XIcon className='w-5 h-5'/>
                </button>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className='create-channel-modal__form'>
                {error && (
                    <div className="form-error">
                        <AlertCircleIcon className='w-4 h-4' />
                        <span>{error}</span>
                    </div>
                )}

                {/* Channel name */}
                <div className="form-group">
                    <div className="input-with-icon">
                        <HashIcon className='w-4 h-4 input-icon' />
                        <input
                            id="channelName" 
                            type="text" 
                            value={channelName}
                            onChange={handleChannelNameChange}
                            placeholder='e.g. marketing'
                            className={`form-input ${error ? "form-input--error" : ""}`}
                            autoFocus
                            maxLength={22}
                        />
                    </div>

                    {/* channel id  preview */}
                    {channelName && (
                        <div className="form-hint">
                            Channel ID will be: #
                            {channelName
                                .toLowerCase()
                                .replace(/\s+/g, "-")
                                .replace(/[^a-z0-9-_]/g, "")
                            }
                        </div>
                    )}
                </div>

                {/* CHANNEL TYPE */}
                <div className="form-group">
                    <label>Channel type</label>

                    <div className="radio-group">
                        <label className="radio-option">
                            <input 
                                type="radio"
                                value="public"
                                checked={channelType === "public"} 
                                onChange={(e) => setChannelType(e.target.value)}
                            />
                            <div className="radio-content">
                                <HashIcon className='size-4' />
                                <div>
                                    <div className="radio-title">Public</div>
                                    <div className="radio-description">Anyone can join this channel</div>
                                </div>
                            </div>
                        </label>

                        <label className='radio-option'>
                            <input 
                                type="radio" 
                                value="private"
                                checked={channelType === "private"}
                                onChange={(e) => setChannelType(e.target.value)}
                            />
                            <div className="radio-content">
                                <LockIcon className='size-4' />
                                <div>
                                    <div className="radio-title">Private</div>
                                    <div className="radio-description">Only invited members can join</div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* add members component */}
                {channelType === "private" && (
                    <div className="form-group">
                        <label>Add members</label>
                        <div className="member-selection-header">
                            <button
                                type="button"
                                className='btn btn-secondary btn-small'
                                onClick={() => setSelectedMembers(users.map((u) => u.id))}
                                disabled={loadingUsers || users.length === 0}
                            >
                                <UsersIcon className='w-4 h-4' />
                                Select Everyone
                            </button>
                            <span className='selected-count'>{selectedMembers.length} selected</span>
                        </div>

                        <div className="members-list">
                            {loadingUsers ? (
                                <p>Loading users...</p>
                            ) : users.length === 0 ? (
                                <p>No users found</p>
                            ) : (
                                users.map((user) => (
                                    <label key={user.id} className='member-item'>
                                        <input 
                                            type="checkbox"
                                            checked={selectedMembers.includes(user.id)}
                                            onChange={() => handleMemberToggle(user.id)}
                                            className='member-checkbox'
                                        />
                                        {user.image ? (
                                            <img 
                                                src={user.image}
                                                alt={user.name || user.id}
                                                className='member-avatar'
                                            />
                                        ) : (
                                            <div className="member-avatar member-avatar-placeholder">
                                                <span>{(user.name || user.id).charAt(0).toUpperCase()}</span>
                                            </div>
                                        )}
                                        <span className='member-name'>{user.name || user.id}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="form-group">
                    <label htmlFor="description">Description (optional)</label>
                    <textarea 
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What's this channel about?"
                        className='form-textarea'
                        row={3}
                    />
                </div>

                {/* Actions */}
                <div className="create-channel-modal__actions">
                    <button
                        type="button" onClick={onClose} className='btn btn-secondary'
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!channelName.trim() || isCreating}
                        className='btn btn-primary'
                    >
                        {isCreating ? "Creating..." : "Create Channel"}
                    </button>
                </div>
            </form>
        </div>
    </div>
  )
}

export default CreateChannelModal;