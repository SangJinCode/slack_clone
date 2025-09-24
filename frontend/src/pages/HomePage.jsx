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
import CustomChannelHeader from "../components/CustomChannelHeader";

import {
  Chat,
  Channel,
  ChannelList,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from "stream-chat-react";

const HomePage = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [activeChannel, setActiveChannel] = useState(null);

    //URL의 쿼리스트링 값을 읽을 수 있는 객체 (URLSearchParams 타입), searchParams은 {key:value}로 저장
    const [searchParams, setSearchParams] = useSearchParams();

    const { chatClient, error, isLoading } = useStreamChat();
  return (
    <div>HomePage</div>
  )
}

export default HomePage