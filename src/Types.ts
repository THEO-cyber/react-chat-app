export type setLoadingType = React.Dispatch<React.SetStateAction<boolean>>;
export type authDataType = {
  email: string;
  password: string;
  confirmPassword?: string;
};

export type userType = {
  id: string;
  username: string;
  email: string;
  isOnline: boolean;
  img: string;
  creationTime?: string;
  lastSeen?: string;
  bio?: string;
};

export type taskListType = {
  id?: string;
  title: string;
  editMode?: boolean;
  tasks?: taskType[];
};

export type taskType = {
  id?: string;
  title: string;
  description: string;
  editMode?: boolean;
  collapsed?: boolean;
};

export type chatTYpe = {
  senderId: string;
  receiverId: string;
  id?: string;
  lastMsg?: string;
  senderToReceiverNewMsgCount?: number;
  receiverToSenderNewMsgCount?: number;
  updatedAt?: string;
};
// Update the messageType to include mediaUrl and mediaType
export type messageType = {
  senderId: string;
  content: string;
  createdAt?: string;
  id?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
};
