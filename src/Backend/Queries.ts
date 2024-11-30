import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "@firebase/auth";
import { auth, db } from "./Firebase";
import { toastErr, toastSucc } from "../utils/toast";
import CatchErr from "../utils/catchErr";
import {
  authDataType,
  chatTYpe,
  messageType,
  setLoadingType,
  taskListType,
  taskType,
  userType,
} from "../Types";
import { NavigateFunction } from "react-router-dom";
import {
  addDoc,
  and,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  or,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  defaultUser,
  setAlertProps,
  setUser,
  setUsers,
  userStorageName,
} from "../Redux/userSlice";
import { AppDispatch } from "../Redux/store";
import ConvertTime from "../utils/ConvertTime";
import AvatarGenerator from "../utils/avatarGenerator";
import {
  addTask,
  addTaskList,
  defaultTask,
  defaultTaskList,
  deleteTask,
  deleteTaskList,
  saveTask,
  saveTaskListTitle,
  setTaskList,
  setTaskListTasks,
} from "../Redux/taskListSlice";
import { deleteUser, updateEmail, updatePassword } from "firebase/auth";
import { setChats, setCurrentMessages } from "../Redux/chatsSlice";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

//collection names
const userColl = "users";
const taskColl = "tasks";
const taskListColl = "taskList";
const chatsColl = "chats";
const messageColl = "messages";

// register or signup a user
export const BE_signUp = (
  data: authDataType,
  setLoading: setLoadingType,
  reset: () => void,
  goTo: NavigateFunction,
  dispatch: AppDispatch
) => {
  const { email, password, confirmPassword } = data;
  // loading true
  setLoading(true);

  if (email && password) {
    if (password === confirmPassword) {
      createUserWithEmailAndPassword(auth, email, password)
        .then(async ({ user }) => {
          const imgLink = AvatarGenerator(user.email?.split("@")[0]);
          const userInfo = await addUserToCollection(
            user.uid,
            user.email || "",
            user.email?.split("@")[0] || "",
            imgLink
          );

          dispatch(setUser(userInfo));

          setLoading(false);
          reset();
          goTo("/dashboard");
        })
        .catch((err) => {
          CatchErr(err);
          setLoading(false);
        });
    } else toastErr("Password must match!", setLoading);
  } else toastErr(" Fields shouldn't be left empty!", setLoading);
};

export const BE_signIn = (
  data: authDataType,
  setLoading: setLoadingType,
  reset: () => void,
  goTo: NavigateFunction,
  dispatch: AppDispatch
) => {
  const { email, password } = data;

  //loading true
  setLoading(true);

  signInWithEmailAndPassword(auth, email, password)
    .then(async ({ user }) => {
      await updateUserInfo({ id: user.uid, isOnline: true });

      const userInfo = await getUserInfo(user.uid);
      dispatch(setUser(userInfo));
      setLoading(false);
      reset();
      goTo("/dashboard");
    })
    .catch((err) => {
      CatchErr(err);
      setLoading(false);
    });
};

export const BE_signOut = (
  dispatch: AppDispatch,
  goTo: NavigateFunction,
  setLoading: setLoadingType,
  deleteAcc?: boolean
) => {
  setLoading(true);

  signOut(auth)
    .then(async () => {
      if (!deleteAcc) await updateUserInfo({ isOffline: true });
      //set currentSelected user

      dispatch(setUser(defaultUser));

      //remove from local storage
      localStorage.removeItem(userStorageName);

      goTo("/auth");

      setLoading(false);
    })
    .catch((err) => CatchErr(err));
};

export const getStorageUser = () => {
  const usr = localStorage.getItem(userStorageName);
  if (usr) return JSON.parse(usr);
  else return "";
};

export const BE_saveProfile = async (
  dispatch: AppDispatch,
  data: { email: string; username: string; password: string; img: string },
  setLoading: setLoadingType
) => {
  setLoading(true);

  const { email, username, password, img } = data;
  const id = getStorageUser().id;

  if (id) {
    if (email && auth.currentUser) {
      updateEmail(auth.currentUser, email)
        .then(() => {
          toastSucc("Email updated successfully!");
        })
        .catch((err) => CatchErr(err));
    }

    if (password && auth.currentUser) {
      updatePassword(auth.currentUser, password)
        .then(() => {
          toastSucc("Password updated successfully!");
        })
        .catch((err) => CatchErr(err));
    }

    if (username || img) {
      await updateUserInfo({ username, img });
      toastSucc("Profile updated successfully!");
    }

    const userInfo = await getUserInfo(id);

    dispatch(setUser(userInfo));
    setLoading(false);
  } else toastErr("BE_saveProfile: id not found");
};

export const BE_deleteAccount = async (
  dispatch: AppDispatch,
  goTo: NavigateFunction,
  setLoading: setLoadingType
) => {
  setLoading(true);

  if (getStorageUser().id) {
    
  const userTaskList = await getAllTaskList();

  if (userTaskList.length > 0) {
    userTaskList.forEach(async (tL) => {
      if (tL.id && tL.tasks) await BE_deleteTaskList(tL.id, tL.tasks, dispatch);
    });
  }

  await deleteDoc(doc(db, userColl, getStorageUser().id));

  const user = auth.currentUser;

  console.log("USER TO BE DELETED", user);

  if (user) {
    deleteUser(user)
      .then(async () => {
        BE_signOut(dispatch, goTo, setLoading, true);
        // window.location.reload()
      })
      .catch((err) => CatchErr(err));
  }
  }

};

// get all users for chats

export const BE_getAllUsers = async (
  dispatch: AppDispatch,
  setLoading: setLoadingType
) => {
  setLoading(true);

  const q = query(collection(db, userColl), orderBy("isOnline", "desc"));
  onSnapshot(q, (usersSnapShot) => {
    let users: userType[] = [];

    usersSnapShot.forEach((user) => {
      const { img, isOnline, username, email, bio, creationTime, lastSeen } =
        user.data();
      users.push({
        id: user.id,
        img,
        isOnline,
        username,
        email,
        bio,
        creationTime: creationTime
          ? ConvertTime(creationTime.toDate())
          : "no date yet: all users  creation time",
        lastSeen: lastSeen
          ? ConvertTime(lastSeen.toDate())
          : "no date yet: all users lastseen",
      });
    });

    const id = getStorageUser().id;
    if (id) {
      dispatch(setUsers(users.filter((u) => u.id !== id)));
    }
    setLoading(false);
  });
};

export const getUserInfo = async (
  id: string,
  setLoading?: setLoadingType
): Promise<userType> => {
  if (setLoading) setLoading(true);

  const userRef = doc(db, userColl, id);
  const user = await getDoc(userRef);

  if (user.exists()) {
    const { img, isOnline, username, email, bio, creationTime, lastSeen } =
      user.data();

    if (setLoading) setLoading(false);

    return {
      id: user.id,
      img,
      isOnline,
      username,
      email,
      bio,
      creationTime: creationTime
        ? ConvertTime(creationTime.toDate())
        : "no date yet: userinfo",
      lastSeen: lastSeen
        ? ConvertTime(lastSeen.toDate())
        : "no date yet: userinfo",
    };
  } else {
    if (setLoading) setLoading(false);
    toastErr("getUserInfo: user not found");
    return defaultUser;
  }
};

const addUserToCollection = async (
  id: string,
  email: string,
  username: string,
  img: string
) => {
  await setDoc(doc(db, userColl, id), {
    isOnline: true,
    img,
    username,
    email,
    creationTime: serverTimestamp(),
    lastSeen: serverTimestamp(),
    bio: `Hi! my name is ${username}, thanks to Theo Michael for  his brilliant intelligence in React`,
  });

  return getUserInfo(id);
};

const updateUserInfo = async ({
  id,
  username,
  img,
  isOnline,
  isOffline,
}: {
  id?: string;
  username?: string;
  img?: string;
  isOnline?: boolean;
  isOffline?: boolean;
}) => {
  if (!id) {
    const storageUser = getStorageUser();
    id = storageUser ? storageUser.id : null;
  }

  if (id) {
    await updateDoc(doc(db, userColl, id), {
      ...(username && { username }),
      ...(img && { img }),
      isOnline: isOnline ?? !isOffline,
      lastSeen: serverTimestamp(),
    });
  }
};

// Task List

export const BE_addTaskList = async (
  dispatch: AppDispatch,
  setLoading: setLoadingType
) => {
  setLoading(true);
  const { title } = defaultTaskList;
  const list = await addDoc(collection(db, taskListColl), {
    title,
    userId: getStorageUser().id,
  });

  const newDocSnap = await getDoc(doc(db, list.path));

  if (newDocSnap.exists()) {
    const newlyAddedDoc: taskListType = {
      id: newDocSnap.id,
      title: newDocSnap.data().title,
    };

    dispatch(addTaskList(newlyAddedDoc));
    setLoading(false);
  } else {
    toastErr("BE_addTaskList:No such doc");
    setLoading(false);
  }
};

export const BE_getTaskList = async (
  dispatch: AppDispatch,
  setLoading: setLoadingType
) => {
  setLoading(true);

  if (getStorageUser().id) {
    
  const taskList = await getAllTaskList();

  dispatch(setTaskList(taskList));
  setLoading(false);
  }

};

export const BE_saveTaskList = async (
  dispatch: AppDispatch,
  setLoading: setLoadingType,
  listId: string,
  title: string
) => {
  setLoading(true);

  await updateDoc(doc(db, taskListColl, listId), { title });

  const updatedTaskList = await getDoc(doc(db, taskListColl, listId));

  setLoading(false);

  dispatch(
    saveTaskListTitle({ id: updatedTaskList.id, ...updatedTaskList.data() })
  );
};

export const BE_deleteTaskList = async (
  listid: string,
  tasks: taskType[],
  dispatch: AppDispatch,
  setLoading?: setLoadingType
) => {
  if (setLoading) setLoading(true);

  if (tasks.length > 0) {
    for (let i = 0; i < tasks.length; i++) {
      const { id } = tasks[i];
      if (id) BE_deleteTask(listid, id, dispatch);
    }
  }

  const listRef = doc(db, taskListColl, listid);
  await deleteDoc(listRef);

  const deletedTaskList = await getDoc(listRef);

  if (!deletedTaskList.exists()) {
    if (setLoading) setLoading(false);

    dispatch(deleteTaskList(listid));
  }
};

const getAllTaskList = async () => {
  const id = getStorageUser().id;
      const q = query(
    collection(db, taskListColl),
    where("userId", "==", id)
  );

  const taskListSnapshot = await getDocs(q);
  const taskList: taskListType[] = [];

  taskListSnapshot.forEach((doc) => {
    const { title } = doc.data();
    taskList.push({
      id: doc.id,
      title,
      editMode: false,
      tasks: [],
    });
  });

  return taskList;
};

export const BE_deleteTask = async (
  listId: string,
  id: string,
  dispatch: AppDispatch,
  setLoading?: setLoadingType
) => {
  if (setLoading) setLoading(true);

  const taskRef = doc(db, taskListColl, listId, taskColl, id);
  await deleteDoc(taskRef);

  const deletedTask = await getDoc(taskRef);

  if (!deletedTask.exists()) {
    if (setLoading) setLoading(false);
    dispatch(deleteTask({ listId, id }));
  }
};

export const BE_addTask = async (
  dispatch: AppDispatch,
  listId: string,
  setLoading: setLoadingType
) => {
  setLoading(true);

  const task = await addDoc(collection(db, taskListColl, listId, taskColl), {
    ...defaultTask,
  });

  const newTaskSnapShot = await getDoc(doc(db, task.path));

  if (newTaskSnapShot.exists()) {
    const { title, description } = newTaskSnapShot.data();
    const newTask: taskType = {
      id: newTaskSnapShot.id,
      title,
      description,
    };
    dispatch(addTask({ listId, newTask }));
    setLoading(false);
  } else {
    toastErr("BE_addTask: No such document");
    setLoading(false);
  }
};

export const BE_saveTask = async (
  dispatch: AppDispatch,
  listId: string,
  data: taskType,
  setLoading: setLoadingType
) => {
  setLoading(true);
  const { id, title, description } = data;
  if (id) {
    const taskRef = doc(db, taskListColl, listId, taskColl, id);
    await updateDoc(taskRef, { title, description });

    const updatedTask = await getDoc(taskRef);
    if (updatedTask.exists()) {
      setLoading(false);
      //dispatch
      dispatch(saveTask({ listId, id: updatedTask.id, ...updatedTask.data() }));
    } else toastErr("BE_saveTask: updated task not found");
  } else toastErr("BE_saveTask: id not found");
};

export const getTasksForTaskList = async (
  dispatch: AppDispatch,
  listId: string,
  setLoading: setLoadingType
) => {
  setLoading(true);
  const taskRef = collection(db, taskListColl, listId, taskColl);
  const tasksSnapshot = await getDocs(taskRef);
  const tasks: taskType[] = [];

  if (!tasksSnapshot.empty) {
    tasksSnapshot.forEach((task) => {
      const { title, description } = task.data();
      tasks.push({
        id: task.id,
        title,
        description,
        editMode: false,
        collapsed: true,
      });
    });
  }

  dispatch(setTaskListTasks({ listId, tasks }));
  setLoading(false);
};

// start a chat
export const BE_startChat = async (
  dispatch: AppDispatch,
  rId: string,
  rName: string,
  setLoading: setLoadingType
) => {
  const sId = getStorageUser().id;
  setLoading(true);

  //check if chat already exists
  const q = query(
    collection(db, chatsColl),
    or(
      and(where("senderId", "==", sId), where("receiverId", "==", rId)),
      and(where("senderId", "==", rId), where("receiverId", "==", sId))
    )
  );
  const res = await getDocs(q);

  //if you find no chat with this two ids then create one
  if (res.empty) {
    const newChat = await addDoc(collection(db, chatsColl), {
      senderId: sId,
      receiverId: rId,
      lastMsg: "",
      updatedAt: serverTimestamp(),
      senderToReceiverNewMsgCount: 0,
      recieverToSenderNewMsgCount: 0,
    });

    const newChatSnapshot = await getDoc(doc(db, newChat.path));

    if (!newChatSnapshot.exists()) {
      toastErr("BE_startChat: new chat not found");
    }
    setLoading(false);
    dispatch(setAlertProps({ open: false }));
    // Navigate to the chat page
    window.location.href = "/dashboard/chat";
  } else {
    toastErr("You already started chatting with " + rName);
    setLoading(false);
    dispatch(setAlertProps({ open: false }));
    // Navigate to the chat page
    window.location.href = "/dashboard/chat";
  }
};

// get users chats

export const BE_getChats = async (dispatch: AppDispatch) => {
  const id = getStorageUser().id;
  console.log("ID", getStorageUser());
  
  const q = query(
    collection(db, chatsColl),
    or(where("senderId", "==", id), where("receiverId", "==", id)),
    orderBy("updatedAt", "desc")
  );

  onSnapshot(q, (chatSnapshot) => {
    const chats: chatTYpe[] = [];

    chatSnapshot.forEach((chat) => {
      const {
        senderId,
        receiverId,
        lastMsg,
        updatedAt,
        senderToReceiverNewMsgCount,
        receiverToSenderNewMsgCount,
      } = chat.data();

      chats.push({
        id: chat.id,
        senderId,
        receiverId,
        lastMsg,
        updatedAt: updatedAt
          ? ConvertTime(updatedAt.toDate())
          : "no date ye: all messages",
        receiverToSenderNewMsgCount,
        senderToReceiverNewMsgCount,
      });
    });

    console.log("CHATS", chats);
    dispatch(setChats(chats));
  });
};

export const BE_getMsgs = async (
  dispatch: AppDispatch,
  chatId: string,
  setLoading: setLoadingType
) => {
  setLoading(true);

  const q = query(
    collection(db, chatsColl, chatId, messageColl),
    orderBy("createdAt", "asc")
  );

  onSnapshot(q, (messagesSnapshot) => {
    let msgs: messageType[] = [];

    messagesSnapshot.forEach((msg) => {
      const { senderId, content, createdAt } = msg.data();
      msgs.push({
        id: msg.id,
        senderId,
        content,
        createdAt: createdAt
          ? ConvertTime(createdAt.toDate())
          : "no date yet: all messages",
      });
    });
    dispatch(setCurrentMessages(msgs));
    setLoading(false);
  });
};

export const BE_sendMsgs = async (
  chatId: string,
  data: messageType,
  setLoading: setLoadingType
) => {
  setLoading(true);

  const res = await addDoc(collection(db, chatsColl, chatId, messageColl), {
    ...data,
    createdAt: serverTimestamp(),
  });

  const newMsg = await getDoc(doc(db, res.path));
  if (newMsg.exists()) {
    setLoading(false);
    await updateNewMsgCount(chatId);
    await updateLastMsg(chatId, newMsg.data().content);
    await updateUserInfo({}); // update last seen
  }
};

// function to check if i created a chat

export const iCreatedChat = (senderId: string) => {
  const myId = getStorageUser().id;
  return myId === senderId;
};

//update message count for user

export const updateNewMsgCount = async (chatId: string, reset?: boolean) => {
  const chat = await getDoc(doc(db, chatsColl, chatId));
  const currentUserId = getStorageUser().id;

  let senderToReceiverNewMsgCount =
    chat.data()?.senderToReceiverNewMsgCount || 0;
  let receiverToSenderNewMsgCount =
    chat.data()?.receiverToSenderNewMsgCount || 0;

  if (currentUserId === chat.data()?.senderId) {
    if (reset) {
      receiverToSenderNewMsgCount = 0;
    } else {
      senderToReceiverNewMsgCount++;
    }
  } else {
    if (reset) {
      senderToReceiverNewMsgCount = 0;
    } else {
      receiverToSenderNewMsgCount++;
    }
  }

  await updateDoc(doc(db, chatsColl, chatId), {
    updatedAt: serverTimestamp(),
    senderToReceiverNewMsgCount,
    receiverToSenderNewMsgCount,
  });
};

//update last messaage

const updateLastMsg = async (chatId: string, lastMsg: string) => {
  await updateNewMsgCount(chatId);
  //await message count here
  await updateDoc(doc(db, chatsColl, chatId), {
    lastMsg,
    updatedAt: serverTimestamp(),
  });
};

// ... camera functionalities

// Update the BE_sendImageMessage function to handle both images and videos
export const BE_sendImageMessage = async (
  chatId: string,
  data: messageType,
  file: File,
  setLoading: setLoadingType
) => {
  setLoading(true);

  const storage = getStorage();
  const storageRef = ref(storage, `chat_media/${chatId}/${Date.now()}_${file.name}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const mediaUrl = await getDownloadURL(snapshot.ref);

    const isVideo = file.type.startsWith('video/');

    const res = await addDoc(collection(db, chatsColl, chatId, messageColl), {
      ...data,
      content: isVideo ? 'Video' : 'Image',
      mediaUrl,
      mediaType: isVideo ? 'video' : 'image',
      createdAt: serverTimestamp(),
    });

    const newMsg = await getDoc(doc(db, res.path));
    if (newMsg.exists()) {
      setLoading(false);
      await updateNewMsgCount(chatId);
      await updateLastMsg(chatId, isVideo ? 'Video' : 'Image');
      await updateUserInfo({}); // update last seen
    }
  } catch (error) {
    console.error('Error uploading media:', error);
    toastErr('Failed to upload media');
    setLoading(false);
  }
};


