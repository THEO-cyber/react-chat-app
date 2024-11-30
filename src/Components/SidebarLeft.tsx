import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../Redux/store";
import { setCurrentSelectedChat, setIsChatsTab } from "../Redux/chatsSlice";
import Chats from "./Chats";
import Users from "./Users";
import { BE_getAllUsers, BE_getChats } from "../Backend/Queries";
import { defaultUser } from "../Redux/userSlice";

function SidebarLeft() {
  const [usersLoading, setUsersLoading] = useState(false);
  const isChatsTab = useSelector((state: RootState) => state.chat.isChatsTab);
  const rightSidebarOpen = useSelector(
    (state: RootState) => state.chat.rightSidebarOpen
  );
  const chats = useSelector((state: RootState) => state.chat.chats);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const get = async () => {
      await BE_getAllUsers(dispatch, setUsersLoading);
      await BE_getChats(dispatch);
    };

    get();
  }, [dispatch]);

  const handleSelectUsersTab = () => {
    dispatch(setIsChatsTab(false));
    dispatch(setCurrentSelectedChat(defaultUser));
  };

  const totalUnreadMessages = chats.reduce(
    (total, chat) =>
      total +
      (chat.senderToReceiverNewMsgCount ?? 0) +
      (chat.receiverToSenderNewMsgCount ?? 0),
    0
  );

  return (
    <Sidebar
      className={`flex-[0.8] absolute md:relative z-10 md:z-0 w-[80%] h-[80%] md:h-full md:w-full ${
        rightSidebarOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex flex-col">
        <div className="flex sticky top-0 z-10">
          <p
            onClick={() => dispatch(setIsChatsTab(true))}
            className={`p-5 flex-1 text-center font-bold cursor-pointer ${
              isChatsTab
                ? "bg-gradient-to-r from-myBlue to-myPink text-white"
                : "bg-gray-200 text-gray-900"
            }`}
          >
            Chats
            {totalUnreadMessages > 0 && (
              <span className="absolute top-2 left-4 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                {totalUnreadMessages}
              </span>
            )}
          </p>
          <p
            onClick={handleSelectUsersTab}
            className={`p-5 flex-1 text-center font-bold cursor-pointer relative ${
              !isChatsTab
                ? "bg-gradient-to-r from-myBlue to-myPink text-white"
                : "bg-gray-200 text-gray-900"
            }`}
          >
            Users
          </p>
        </div>
        <div className="flex-1 flex flex-col py-2 max-h-full overflow-scroll">
          {isChatsTab ? <Chats /> : <Users loading={usersLoading} />}
        </div>
      </div>
    </Sidebar>
  );
}

export default SidebarLeft;
