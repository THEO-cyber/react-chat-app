import React, { useEffect, useRef, useState } from "react";
import {
  BsFillCameraFill,
  BsFillEmojiSunglassesFill,
  BsFillPeopleFill,
  BsFillSendFill,
} from "react-icons/bs";
import Icon from "./Icon";
import Input from "./input";
import { AppDispatch, RootState } from "../Redux/store";
import { useDispatch, useSelector } from "react-redux";
import { ImAttachment } from "react-icons/im";
import { setRightSidebarOpen } from "../Redux/chatsSlice";
import {
  BE_getMsgs,
  BE_sendMsgs,
  getStorageUser,
  BE_sendImageMessage,
} from "../Backend/Queries";
import { MessagesLoader } from "./Loaders";
import FlipMove from "react-flip-move";
import { toastErr, toastInfo } from "../utils/toast";
import EmojiPicker from "emoji-picker-react";

function ChatArea() {
  const bottomContainerRef = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState("");
  const [getMsgsLoading, setGetMsgsLoading] = useState(false);
  const [createMsgLoading, setCreateMsgLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const currentSelectectedChat = useSelector(
    (state: RootState) => state.chat.currentSelectedChat
  );
  const messages = useSelector(
    (state: RootState) => state.chat.currentMessages
  );
  const chatId = currentSelectectedChat.chatId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const get = async () => {
      if (chatId) await BE_getMsgs(dispatch, chatId, setGetMsgsLoading);
    };
    get();
  }, [currentSelectectedChat.id, chatId, dispatch]);

  const handleSendMsg = async () => {
    if (msg.trim()) {
      const data = {
        senderId: getStorageUser().id,
        content: msg,
      };
      setMsg("");
      if (chatId) await BE_sendMsgs(chatId, data, setCreateMsgLoading);
      if (bottomContainerRef)
        bottomContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    } else toastInfo("Enter some text message");
  };

  const checkEnter = (e: any) => {
    if (e.key === "Enter") handleSendMsg();
  };

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setMsg((prevMsg) => prevMsg + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && chatId) {
      const data = {
        senderId: getStorageUser().id,
        content: "",
        imageUrl: "",
      };
      await BE_sendImageMessage(chatId, data, file, setCreateMsgLoading);
      if (bottomContainerRef)
        bottomContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && chatId) {
      const data = {
        senderId: getStorageUser().id,
        content: "",
        fileUrl: "",
      };

      await BE_sendImageMessage(chatId, data, file, setCreateMsgLoading);
      if (bottomContainerRef)
        bottomContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toastErr("Failed to access camera");
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob && chatId) {
          const file = new File([blob], "camera_capture.jpg", {
            type: "image/jpeg",
          });
          const data = {
            senderId: getStorageUser().id,
            content: "",
            imageUrl: "",
          };
          await BE_sendImageMessage(chatId, data, file, setCreateMsgLoading);
          setIsCapturing(false);
          videoRef.current!.srcObject = null;
        }
      }, "image/jpeg");
    }
  };

  return (
    <div className="flex-1 lg:flex-[0.4] max-h-full flex flex-col px-2 md:px-5 gap-2">
      {getMsgsLoading ? (
        <MessagesLoader />
      ) : (
        <div className="flex-1 flex flex-col max-h-screen overflow-y-scroll shadow-inner gap-2">
          <FlipMove className="fflex-1 flex flex-col gap-5">
            {messages.map((msg) => {
              const myId = getStorageUser().id;
              if (msg.senderId === myId) {
                return (
                  <div
                    key={msg.id}
                    className="bg-gradient-to-r from-myBlue to-myPink text-white text-xs self-end max-w-md shadow-md py-3 px-10 rounded-t-full rounded-bl-full border-2 border-white"
                  >
                    {msg.content}
                  </div>
                );
              } else
                return (
                  <div
                    key={msg.id}
                    className="bg-gray-300 text-xs self-start max-w-md shadow-md py-3 px-10 rounded-t-full rounded-br-full border-2 border-white"
                  >
                    {msg.content}
                  </div>
                );
            })}
          </FlipMove>
          <div ref={bottomContainerRef} className="pb-36 flex"></div>
        </div>
      )}

      <div className="flex gap-1 md:gap-5">
        <div className="bg-white p-[2px] flex-1 rounded-full shadow-md flex items-center gap-2 border-2 border-e-gray-300">
          <Icon
            IconName={BsFillPeopleFill}
            className="text-gray-500 block md:hidden"
            reduceOpacityOnHover={false}
            size={15}
            onClick={() => dispatch(setRightSidebarOpen())}
          />
          <Icon
            IconName={BsFillEmojiSunglassesFill}
            className="text-gray-500 hidden md:block"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          />
          {showEmojiPicker && (
            <div className="absolute bottom-16">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
          <Input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            name={`message to ${currentSelectectedChat?.username}`}
            className="border-none outline-none text-sm md:text-[15px]"
            onKeyDown={checkEnter}
            disabled={createMsgLoading}
          />
          <Icon
            IconName={ImAttachment}
            className="text-gray-500 hidden md:block rotate-90"
            onClick={() => fileInputRef.current?.click()}
          />
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <Icon
            IconName={BsFillCameraFill}
            className="text-gray-500 hidden md:block"
            onClick={handleCameraCapture}
          />
          {/* <input
            type="file"
            id="imageUpload"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          /> */}
        </div>

        <div className="flex item-center justify-center">
          <Icon
            onClick={handleSendMsg}
            IconName={BsFillSendFill}
            reduceOpacityOnHover={false}
            loading={createMsgLoading}
          />
        </div>
      </div>
      {isCapturing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <video ref={videoRef} autoPlay className="mb-4"></video>
            <div className="flex justify-between">
              <button
                onClick={() => setIsCapturing(false)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={captureImage}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatArea;
