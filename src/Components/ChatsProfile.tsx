import React, { useEffect, useState } from "react";
import { chatTYpe, userType } from "../Types";
import { getUserInfo, iCreatedChat } from "../Backend/Queries";
import { toastErr } from "../utils/toast";
import UserHeaderProfile from "./UserHeaderProfile";
import { defaultUser } from "../Redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../Redux/store";
import { setCurrentSelectedChat, setRightSidebarOpen } from "../Redux/chatsSlice";

type ChatsProfileType = {
  userId?: string;
  chat: chatTYpe;
};

function ChatsProfile({ userId, chat }: ChatsProfileType) {
  const [userLoading, setUserLoading] = useState(false);
  const [user, setuser] = useState<userType>(defaultUser);
  const dispatch = useDispatch<AppDispatch>()
  const currentSelectedChat = useSelector((state:RootState) => state.chat.currentSelectedChat)
  const {
    id: chatId,
    senderId,
    lastMsg,
    receiverToSenderNewMsgCount,
    senderToReceiverNewMsgCount,
  } = chat;
  useEffect(() => {
    const getUser = async () => {
      if (userId) {
        const usr = await getUserInfo(userId, setUserLoading);
        setuser(usr);
      } else toastErr("ChatsProfile: user not found");
    };
    getUser();
  }, [userId]);

  const handleSelectedChat = () => {
    dispatch(setCurrentSelectedChat({
      ...user,
      chatId,
      receiverToSenderNewMsgCount,
      senderToReceiverNewMsgCount,
    }))
    dispatch(setRightSidebarOpen())
  };

  return (
    <UserHeaderProfile
      handleClick={handleSelectedChat}
      user={user}
      otherUser
      loading={userLoading}
      lastMsg={lastMsg || "last message"}
      isSelected={userId === currentSelectedChat.id}
      newMsgCount={
        iCreatedChat(senderId)
          ? receiverToSenderNewMsgCount
          : senderToReceiverNewMsgCount
      }
    />
  );
}

export default ChatsProfile;
