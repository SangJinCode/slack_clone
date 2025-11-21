import React from 'react'
import { useEffect, useState } from "react";
import { useChatContext } from "stream-chat-react";
import { XIcon } from "lucide-react";

const InviteModal = ({ channel, onClose }) => {
    console.log("*****channel in InviteModal*****", channel)
    console.log("*****channel.state.members in InviteModal*****", channel.state.members)
    //Stream Chat의 API 요청을 직접 보낼 수 있는 객체
    const { client } = useChatContext();

    //채널에 참가하지 않은 유저
    const [users, setUsers] = useState([]);

    //invite 하기 위해 선택된 유저들
    const [selectedMembers, setSelectedMembers] = useState([]);

    const [isLoadingUsers, setIsLoadingUsers] = useState(true);

    const [error, setError] = useState("");

    const [isInviting, setIsInviting] = useState(false);

    //** inviting하기 위해 channel에 참가한 유저를 제외한 유저 정보만 불러온다. */
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoadingUsers(true)
            setError("");

            try {
                //channel.state.members의 key값만 새 배열로 반환 즉 참가한 유저 ID
                const members = Object.keys(channel.state.members);

                //$nin을 사요해 현재 이 채널의 멤버 목록(members)에 없는 사용자만 불러온다.
                const res = await client.queryUsers({ id: { $nin: members}}, { name: 1 }, { limit: 30 });
                
                //채널에 참가하지 않은 유저 정보
                setUsers(res.users);

            } catch (error) {
                console.log("Error fetching users", error);
                setError("failed to load users");
            } finally {
                setIsLoadingUsers(false)
            }
        }

        fetchUsers()
    }, [channel, client])


    //** selectedMembers로 전달된 새로운 유저를 채널에 참가시키기 위한 함수
    const handleInvite = async () => {
        
        if (selectedMembers.length === 0) return;
        setIsInviting(true)
        setError("");

        try {
            //채널에 새로운 유저 추가
            await channel.addMembers(selectedMembers)

            //모달창 닫음(setShowInvite(false))
            onClose();
        } catch (error) {
            setError("Failed to invite users")
            console.log("Error inviting users:", error)
        } finally {
            setIsInviting(false)
        }
    }


  return (
    <div className="create-channel-modal-overlay">
        <div className="create-channel-modal">
            {/* HEADER */}
            <div className="create-channel-modal__header">
                <h2 className="">Invite Users</h2>
                <button className="create-channel-modal__close" onClick={onClose}>
                    <XIcon className='size-4' />
                </button>
            </div>

            {/* CONTENT */}
            <div className="create-channel-modal__form">
                {isLoadingUsers && <p>Loading users...</p>}
                {error && <p className='form-error'>{error}</p>}

                {users.length === 0 && !isLoadingUsers && <p>No users found</p>}

                {/* users 배열에 data가 있으면 실행 */}
                {users.length > 0 &&
                users.map((user) => {
                    // <input>에서 onChange 이벤트 발생시 user.id를 selectedMembers()에 추가한다.
                    //추가되면 isChecked가 true가되면서 체크되는 css 적용
                    const isChecked = selectedMembers.includes(user.id);

                    return (
                        <label
                            key={user.id}
                            className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all shadow-sm bg-white hover:bg-[#f5f3ff] border-2${
                                isChecked ? "border-[#611f69] bg-[#f3e6fa]" : "border-gray-200"
                            }`}
                        >
                            {/* checked를 옵션을 사용하지 않는 비제어 컴포넌트 방식 추천하는 방식은 checked={isChecked} 형태 */}
                            <input 
                                type="checkbox"
                                className='checkbox checkbox-primary checkbox-sm accent-[#611f69]'
                                value={user.id}
                                onChange={(e) => {
                                    if (e.target.checked) setSelectedMembers([...selectedMembers, user.id])
                                    else setSelectedMembers(selectedMembers.filter((id) => id !== user.id))
                                }}
                            />

                            {/* 이미지가 있으면 이미지 표시 없으면 name이나 id 표시 */}
                            {user.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name}
                                    className='size-9 rounded-full object-cover border border-gary-300'
                                />
                            ) : (
                                <div className="size-9 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-lg">
                                    {(user.name || user.id).charAt(0).toUpperCase()}
                                </div>
                            )}

                            <span className="font-medium text-[#611f69] text-base">
                                {user.name || user.id}
                            </span>
                        </label>
                    )
                })}

                {/* ACTIONS */}
                <div className="create-channel-modal__actions mt-4">
                    <button className="btn btn-secondary" onClick={onClose} disabled={isInviting}>
                        Cancel
                    </button>

                    {/* handleInvite 함수를 실행하여 selectedMembers에 있는 유저를 채널에 참가시킨다. */}
                    <button 
                        className="btn btn-secondary" 
                        onClick={handleInvite} 
                        disabled={!selectedMembers.length || isInviting}
                    >   
                        {isInviting ? "Inviting..." : "Invite"}
                    </button>
                </div>
            </div>
        </div>
    </div>
  )
}

export default InviteModal;