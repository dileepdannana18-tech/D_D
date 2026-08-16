import {
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  baseUrl,
  getRequest,
  postRequest,
} from "../utils/services";

import { io } from "socket.io-client";


export const ChatContext =
  createContext();


export const ChatContextProvider = ({
  children,
  user,
}) => {


  // ====================================================
  // STATE
  // ====================================================

  const [
    userChats,
    setUserChats,
  ] = useState([]);


  const [
    isUserChatsLoading,
    setIsUserChatsLoading,
  ] = useState(false);


  const [
    userChatsError,
    setUserChatsError,
  ] = useState(null);


  const [
    potentialChats,
    setPotentialChats,
  ] = useState([]);


  const [
    currentChat,
    setCurrentChat,
  ] = useState(null);


  const [
    messages,
    setMessages,
  ] = useState([]);


  const [
    isMessagesLoading,
    setIsMessagesLoading,
  ] = useState(false);


  const [
    messagesError,
    setMessagesError,
  ] = useState(null);


  const [
    sendTextMessageError,
    setSendTextMessageError,
  ] = useState(null);


  const [
    newMessage,
    setNewMessage,
  ] = useState(null);


  const [
    socket,
    setSocket,
  ] = useState(null);


  const [
    onlineUsers,
    setOnlineUsers,
  ] = useState([]);


  // Telegram presence is separate from
  // normal Socket.IO user presence.

  const [
    telegramBotOnline,
    setTelegramBotOnline,
  ] = useState(false);


  const [
    notifications,
    setNotifications,
  ] = useState([]);


  const [
    allUsers,
    setAllUsers,
  ] = useState([]);


  // ====================================================
  // SOCKET URL
  // ====================================================

  // Prefer VITE_SOCKET_URL. If missing (common on Vercel),
  // derive the Socket.IO host from VITE_API_URL so production
  // does not fall back to localhost and break live delivery.
  const SOCKET_URL = (() => {


    const explicitSocketUrl =
      import.meta.env.VITE_SOCKET_URL;


    if (
      explicitSocketUrl &&
      String(explicitSocketUrl).trim()
    ) {

      return String(
        explicitSocketUrl
      ).replace(
        /\/$/,
        ""
      );

    }


    const apiUrl =
      import.meta.env.VITE_API_URL;


    if (
      apiUrl &&
      String(apiUrl).trim()
    ) {

      return String(apiUrl)
        .replace(
          /\/api\/?$/,
          ""
        )
        .replace(
          /\/$/,
          ""
        );

    }


    return "http://localhost:3000";

  })();


  // ====================================================
  // TELEGRAM USER ID
  // ====================================================

  const TELEGRAM_USER_ID =
    import.meta.env.VITE_TELEGRAM_USER_ID;


  // Only this web user may message TelegramBot.
  // Fallback matches server/config/telegramConfig.js webAppUserId (dileep).
  const TELEGRAM_OWNER_USER_ID =
    import.meta.env.VITE_TELEGRAM_OWNER_USER_ID ||
    "6a001784c7c73a1aef7fe480";


  const canAccessTelegram =
    Boolean(
      TELEGRAM_OWNER_USER_ID
    ) &&
    String(user?._id) ===
      String(
        TELEGRAM_OWNER_USER_ID
      );


  const isTelegramBotMember =
    (members = []) =>

      Boolean(
        TELEGRAM_USER_ID
      ) &&

      members.some(

        (memberId) =>

          String(memberId) ===
          String(
            TELEGRAM_USER_ID
          )

      );


  // ====================================================
  // SOCKET CONNECTION
  // ====================================================

  useEffect(() => {


    if (!user?._id) {

      return;

    }


    const newSocket =
      io(
        SOCKET_URL,
        {

          transports: [
            "websocket",
            "polling",
          ],

        }
      );


    setSocket(
      newSocket
    );


    // ==================================================
    // CONNECT
    // ==================================================

    newSocket.on(
      "connect",
      () => {


        console.log(
          "Socket connected:",
          newSocket.id
        );


        newSocket.emit(
          "addNewUser",
          user._id
        );

      }
    );


    // ==================================================
    // CONNECTION ERROR
    // ==================================================

    newSocket.on(
      "connect_error",
      (error) => {


        console.log(
          "Socket connection error:",
          error.message
        );

      }
    );


    // ==================================================
    // CLEANUP
    // ==================================================

    return () => {


      newSocket.disconnect();


      setSocket(
        null
      );

    };


  }, [
    user?._id,
    SOCKET_URL,
  ]);


  // ====================================================
  // ONLINE USERS
  // ====================================================

  useEffect(() => {


    if (!socket) {

      return;

    }


    const handleOnlineUsers =
      (users) => {


        const safeUsers =
          (users || []).filter(

            (onlineUser) =>

              !(
                Boolean(
                  TELEGRAM_USER_ID
                ) &&
                String(
                  onlineUser?.userId
                ) ===
                  String(
                    TELEGRAM_USER_ID
                  )
              )

          );


        setOnlineUsers(
          safeUsers
        );

      };


    socket.on(
      "getOnlineUsers",
      handleOnlineUsers
    );


    return () => {


      socket.off(
        "getOnlineUsers",
        handleOnlineUsers
      );

    };


  }, [socket, TELEGRAM_USER_ID]);


  // ====================================================
  // TELEGRAM BOT STATUS (activity-based presence)
  // ====================================================
  // Server marks Online only after recent Telegram
  // activity; Offline after inactivity timeout.
  // Never derived from Socket.IO onlineUsers.

  useEffect(() => {


    if (!socket) {

      return;

    }


    const handleTelegramBotStatus =
      (status) => {


        console.log(
          "Telegram Bot Online:",
          status
        );


        setTelegramBotOnline(
          Boolean(status)
        );

      };


    socket.on(
      "telegramBotStatus",
      handleTelegramBotStatus
    );


    // Request current status on (re)connect in case
    // the push-on-connect emit was missed.
    socket.emit(
      "getTelegramBotStatus"
    );


    return () => {


      socket.off(
        "telegramBotStatus",
        handleTelegramBotStatus
      );

    };


  }, [socket]);


  // ====================================================
  // SEND SOCKET MESSAGE
  // ====================================================

  useEffect(() => {


    if (
      !socket ||
      !newMessage?.recipientId
    ) {

      return;

    }


    socket.emit(
      "sendMessage",
      newMessage
    );


  }, [
    newMessage,
    socket,
  ]);


  // ====================================================
  // RECEIVE NORMAL WEB MESSAGE
  // ====================================================

  useEffect(() => {


    if (!socket) {

      return;

    }


    const handleMessage =
      (response) => {


        if (
          !response?.chatId
        ) {

          return;

        }


        // Only append into the open conversation.
        // Notifications still update the sidebar.

        if (
          String(currentChat?._id) !==
          String(response.chatId)
        ) {

          return;

        }


        setMessages(
          (previousMessages) => {


            const alreadyExists =
              previousMessages.some(

                (message) =>

                  message?._id &&
                  response?._id &&
                  String(
                    message._id
                  ) ===
                    String(
                      response._id
                    )

              );


            if (
              alreadyExists
            ) {

              return previousMessages;

            }


            return [

              ...previousMessages,

              response,

            ];

          }
        );

      };


    socket.on(
      "getMessage",
      handleMessage
    );


    return () => {


      socket.off(
        "getMessage",
        handleMessage
      );

    };


  }, [
    socket,
    currentChat,
  ]);


  // ====================================================
  // RECEIVE TELEGRAM MESSAGE
  // ====================================================

  useEffect(() => {


    if (!socket) {

      return;

    }


    const handleTelegramMessage =
      (message) => {


        if (
          String(currentChat?._id) !==
          String(message.chatId)
        ) {

          return;

        }


        setMessages(
          (previousMessages) => [

            ...previousMessages,

            message,

          ]
        );

      };


    socket.on(
      "telegramMessage",
      handleTelegramMessage
    );


    return () => {


      socket.off(
        "telegramMessage",
        handleTelegramMessage
      );

    };


  }, [
    socket,
    currentChat,
  ]);


  // ====================================================
  // NOTIFICATION KEY
  // ====================================================

  const getNotificationKey =
    (notification) =>

      notification.id ||

      `${notification.senderId}-${String(
        notification.date
      )}-${notification.text}`;


  // ====================================================
  // RECEIVE NOTIFICATION
  // ====================================================

  useEffect(() => {


    if (!socket) {

      return;

    }


    const handleNotification =
      (response) => {


        const isChatOpen =
          currentChat?.members?.some(

            (id) =>

              String(id) ===
              String(
                response.senderId
              )

          );


        const notification = {

          ...response,

          id:
            response.id ||
            `${response.senderId}-${Date.now()}-${Math.random()}`,

          isRead:
            isChatOpen
              ? true
              : false,

        };


        setNotifications(
          (previousNotifications) => [

            notification,

            ...previousNotifications,

          ]
        );

      };


    socket.on(
      "getNotification",
      handleNotification
    );


    return () => {


      socket.off(
        "getNotification",
        handleNotification
      );

    };


  }, [
    socket,
    currentChat,
  ]);


  // ====================================================
  // GET ALL USERS
  // ====================================================

  useEffect(() => {


    const getUsers =
      async () => {


        const response =
          await getRequest(
            `${baseUrl}/users`
          );


        if (
          response.error
        ) {

          return;

        }


        const pChats =
          response.filter(
            (otherUser) => {


              if (
                String(user?._id) ===
                String(otherUser._id)
              ) {

                return false;

              }


              // Hide TelegramBot from non-owners.
              if (
                Boolean(
                  TELEGRAM_USER_ID
                ) &&
                String(
                  otherUser._id
                ) ===
                  String(
                    TELEGRAM_USER_ID
                  ) &&
                String(user?._id) !==
                  String(
                    TELEGRAM_OWNER_USER_ID
                  )
              ) {

                return false;

              }


              let isChatCreated =
                false;


              if (userChats) {


                isChatCreated =
                  userChats.some(

                    (chat) =>

                      String(
                        chat.members[0]
                      ) ===
                        String(
                          otherUser._id
                        ) ||

                      String(
                        chat.members[1]
                      ) ===
                        String(
                          otherUser._id
                        )

                  );

              }


              return !isChatCreated;

            }
          );


        setPotentialChats(
          pChats
        );


        setAllUsers(
          response
        );

      };


    getUsers();


  }, [
    userChats,
    user,
  ]);


  // ====================================================
  // GET USER CHATS
  // ====================================================

  useEffect(() => {


    const getUserChats =
      async () => {


        if (!user?._id) {

          return;

        }


        setIsUserChatsLoading(
          true
        );


        const response =
          await getRequest(
            `${baseUrl}/chats/${user._id}`
          );


        setIsUserChatsLoading(
          false
        );


        if (
          response.error
        ) {


          return setUserChatsError(
            response
          );

        }


        setUserChats(
          Array.isArray(response)
            ? response.filter(
                (chat) => {

                  if (
                    !isTelegramBotMember(
                      chat?.members
                    )
                  ) {

                    return true;

                  }


                  return (
                    String(
                      user._id
                    ) ===
                    String(
                      TELEGRAM_OWNER_USER_ID
                    )
                  );

                }
              )
            : response
        );

      };


    getUserChats();


  }, [
    user,
    notifications,
  ]);


  // Drop a TelegramBot chat if the signed-in user is not the owner.
  useEffect(() => {


    if (
      !currentChat ||
      canAccessTelegram
    ) {

      return;

    }


    if (
      isTelegramBotMember(
        currentChat.members
      )
    ) {

      setCurrentChat(
        null
      );

    }


  }, [
    currentChat,
    canAccessTelegram,
  ]);


  // ====================================================
  // GET MESSAGES
  // ====================================================

  useEffect(() => {


    if (
      !currentChat?._id
    ) {


      setMessages([]);


      return;

    }


    const getMessages =
      async () => {


        setIsMessagesLoading(
          true
        );


        const response =
          await getRequest(

            `${baseUrl}/messages/${currentChat._id}`

          );


        setIsMessagesLoading(
          false
        );


        if (
          response.error
        ) {


          return setMessagesError(
            response
          );

        }


        setMessages(
          response
        );

      };


    getMessages();


  }, [
    currentChat,
  ]);


  // ====================================================
  // SEND TEXT MESSAGE
  // ====================================================

  const sendTextMessage =
    useCallback(

      async (
        textMessage,
        sender,
        currentChatId
      ) => {


        if (
          !textMessage?.trim()
        ) {

          return;

        }


        const recipientId =
          currentChat?.members?.find(

            (id) =>

              String(id) !==
              String(sender._id)

          );


        if (
          Boolean(
            TELEGRAM_USER_ID
          ) &&
          String(recipientId) ===
            String(
              TELEGRAM_USER_ID
            ) &&
          String(sender._id) !==
            String(
              TELEGRAM_OWNER_USER_ID
            )
        ) {

          return setSendTextMessageError(
            {
              error: true,
              message:
                "Only the Telegram owner can send messages to TelegramBot.",
            }
          );

        }


        const response =
          await postRequest(

            `${baseUrl}/messages`,

            JSON.stringify({

              chatId:
                currentChatId,

              senderId:
                sender._id,

              text:
                textMessage,

            })

          );


        if (
          response.error
        ) {


          return setSendTextMessageError(
            response
          );

        }


        // Attach recipient so the socket server can
        // target the correct online user socket(s).

        if (
          recipientId
        ) {

          setNewMessage({

            ...response,

            recipientId:
              String(
                recipientId
              ),

          });

        }


        setMessages(
          (previousMessages) => {


            const alreadyExists =
              previousMessages.some(

                (message) =>

                  message?._id &&
                  response?._id &&
                  String(
                    message._id
                  ) ===
                    String(
                      response._id
                    )

              );


            if (
              alreadyExists
            ) {

              return previousMessages;

            }


            return [

              ...previousMessages,

              response,

            ];

          }
        );


      },

      [currentChat]

    );


  // ====================================================
  // UPDATE CURRENT CHAT
  // ====================================================

  const updateCurrentChat =
    useCallback(

      (chat) => {


        setCurrentChat(
          chat
        );


      },

      []

    );


  // ====================================================
  // CREATE CHAT
  // ====================================================

  const createChat =
    useCallback(

      async (
        firstId,
        secondId
      ) => {


        if (
          Boolean(
            TELEGRAM_USER_ID
          ) &&
          (
            String(firstId) ===
              String(
                TELEGRAM_USER_ID
              ) ||
            String(secondId) ===
              String(
                TELEGRAM_USER_ID
              )
          ) &&
          String(user?._id) !==
            String(
              TELEGRAM_OWNER_USER_ID
            )
        ) {

          return;

        }


        const response =
          await postRequest(

            `${baseUrl}/chats`,

            JSON.stringify({

              firstId,
              secondId,

            })

          );


        if (
          response.error
        ) {

          return;

        }


        setUserChats(
          (previousChats) => [

            ...previousChats,

            response,

          ]
        );


      },

      [user]

    );


  // ====================================================
  // MARK ALL NOTIFICATIONS READ
  // ====================================================

  const markAllNotificationsAsRead =
    useCallback(

      (notificationsToMark) => {


        setNotifications(
          (previousNotifications) =>

            previousNotifications.map(
              (notification) =>

                notificationsToMark.some(

                  (item) =>

                    getNotificationKey(
                      item
                    ) ===
                    getNotificationKey(
                      notification
                    )

                )

                  ? {

                      ...notification,

                      isRead:
                        true,

                    }

                  : notification

            )

        );

      },

      []

    );


  // ====================================================
  // MARK ONE NOTIFICATION READ
  // ====================================================

  const markNotificationsAsRead =
    useCallback(

      (notification) => {


        setNotifications(
          (previousNotifications) =>

            previousNotifications.map(
              (item) =>

                getNotificationKey(
                  item
                ) ===
                getNotificationKey(
                  notification
                )

                  ? {

                      ...item,

                      isRead:
                        true,

                    }

                  : item

            )

        );

      },

      []

    );


  // ====================================================
  // MARK USER NOTIFICATIONS READ
  // ====================================================

  const markThisUserNotificationsAsRead =
    useCallback(

      (notificationsToMark) => {


        setNotifications(
          (previousNotifications) =>

            previousNotifications.map(
              (notification) =>

                notificationsToMark.some(

                  (item) =>

                    getNotificationKey(
                      item
                    ) ===
                    getNotificationKey(
                      notification
                    )

                )

                  ? {

                      ...notification,

                      isRead:
                        true,

                    }

                  : notification

            )

        );

      },

      []

    );


  // ====================================================
  // PROVIDER
  // ====================================================

  return (

    <ChatContext.Provider
      value={{

        userChats,
        isUserChatsLoading,
        userChatsError,

        potentialChats,

        createChat,

        updateCurrentChat,

        messages,
        isMessagesLoading,
        messagesError,

        currentChat,

        sendTextMessage,
        sendTextMessageError,

        newMessage,

        onlineUsers,

        telegramBotOnline,
        TELEGRAM_USER_ID,
        TELEGRAM_OWNER_USER_ID,
        canAccessTelegram,

        notifications,

        allUsers,

        markAllNotificationsAsRead,
        markNotificationsAsRead,
        markThisUserNotificationsAsRead,

      }}
    >

      {children}

    </ChatContext.Provider>

  );

};