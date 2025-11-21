import { StreamChat } from "stream-chat";
import { ENV } from "../config/env.js";

const streamClient = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);

//upsert = "update" + "insert", 해당 userId가 존재하지 않으면 → 새 유저 생성
export const upsertStreamUser = async (userData) => {
    try {
        await streamClient.upsertUser(userData);
        console.log("Stream user upserted successfully:", userData.name)
        return userData;
    } catch (error) {
        console.log("Error upserting Stream user:", error)
    }
}

export const deleteStreamUser = async (userId) => {
    try {
        await streamClient.deleteUser(userId);
        console.log("Stream user deleted successfully:", userId)
        return userData;
    } catch (error) {
        console.log("Error deleting Stream user:", error)
    }
}

export const generateStreamToken = async (userId) => {
    try {
        const userIdString = userId.toString();
        return streamClient.createToken(userIdString)
    } catch (error) {
        console.log("Error generating Stream token:", error)
        return null
    }
}

export const addUserToPublicChannels = async(newUserId) => {
    //누구나 발견 가능한 공개 채널(public channel)"을 불러온다.
    const publicChannels = await streamClient.queryChannels({ discoverable: true })

    //새 유저를 모든 공개 채널에 넣기 (channel.addMembers)
    for (const channel of publicChannels) {
        await channel.addMembers([newUserId]);
    }
}
