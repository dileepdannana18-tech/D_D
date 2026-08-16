import {
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";

import {
  AuthContext,
} from "../../context/AuthContext";

import {
  ChatContext,
} from "../../context/ChatContext";

import {
  useFetchRecipientUser,
} from "../../hooks/useFetchRecipient";

import moment from "moment";

import InputEmoji from "react-input-emoji";

import avatar from "../../assets/avatar.jpg";


const ChatBox = () => {


  // ====================================================
  // AUTH
  // ====================================================

  const {
    user,
  } =
    useContext(
      AuthContext
    );


  // ====================================================
  // CHAT CONTEXT
  // ====================================================

  const {

    currentChat,

    messages,

    isMessagesLoading,

    sendTextMessage,

    onlineUsers,

    telegramBotOnline,

    TELEGRAM_USER_ID,

    canAccessTelegram,

  } =
    useContext(
      ChatContext
    );


  // ====================================================
  // RECIPIENT
  // ====================================================

  const {
    recipientUser,
  } =
    useFetchRecipientUser(
      currentChat,
      user
    );


  // ====================================================
  // MESSAGE STATE
  // ====================================================

  const [
    textMessage,
    setTextMessage,
  ] =
    useState("");


  // ====================================================
  // SCROLL
  // ====================================================

  const scroll =
    useRef();


  useEffect(
    () => {


      scroll.current?.scrollIntoView({

        behavior:
          "smooth",

      });


    },
    [messages]
  );


  // ====================================================
  // TELEGRAM BOT CHECK
  // ====================================================

  const isTelegramBot =

    (
      Boolean(
        TELEGRAM_USER_ID
      ) &&

      String(
        recipientUser?._id
      ) ===
      String(
        TELEGRAM_USER_ID
      )
    ) ||

    String(
      recipientUser?.name || ""
    ).toLowerCase() ===
      "telegrambot";


  const canSendToTelegram =
    !isTelegramBot ||
    canAccessTelegram;


  // ====================================================
  // NORMAL WEB USER STATUS
  // ====================================================

  const normalUserOnline =
    onlineUsers?.some(

      (onlineUser) =>

        String(
          onlineUser?.userId
        ) ===
        String(
          recipientUser?._id
        )

    );


  // ====================================================
  // FINAL RECIPIENT STATUS
  // ====================================================

  // TelegramBot must NEVER use Socket.IO onlineUsers.
  // Presence is activity-based (recent Telegram traffic).

  const isRecipientOnline =
    isTelegramBot
      ? Boolean(
          telegramBotOnline
        )
      : normalUserOnline;


  // ====================================================
  // NO CHAT
  // ====================================================

  if (!recipientUser) {

    return (

      <div className="flex items-center justify-center h-full text-slate-400 text-xl">

        No conversation selected yet...

      </div>

    );

  }


  // ====================================================
  // LOADING
  // ====================================================

  if (isMessagesLoading) {

    return (

      <div className="flex items-center justify-center h-full text-slate-400 text-xl">

        Loading Chat...

      </div>

    );

  }


  // ====================================================
  // SEND MESSAGE
  // ====================================================

  const handleSendMessage =
    () => {


      if (
        !canSendToTelegram
      ) {

        return;

      }


      if (
        !textMessage.trim()
      ) {

        return;

      }


      sendTextMessage(

        textMessage,

        user,

        currentChat?._id

      );


      setTextMessage("");

    };


  // ====================================================
  // UI
  // ====================================================

  return (

    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center gap-4 px-6 py-4 bg-slate-800 border-b border-slate-700">


        {/* AVATAR */}

        <div className="relative">


          <img

            src={avatar}

            alt={
              `${recipientUser?.name || "User"} avatar`
            }

            className="
              w-12
              h-12
              rounded-full
              object-cover
              border-2
              border-slate-600
            "

          />


          {/* ONLINE DOT */}

          {isRecipientOnline && (

            <span
              className="
                absolute
                bottom-0
                right-0
                w-3
                h-3
                bg-green-500
                rounded-full
                border-2
                border-slate-800
              "
            />

          )}


        </div>


        {/* USER INFO */}

        <div>


          <h2 className="text-white text-lg font-semibold">

            {recipientUser?.name}

          </h2>


          <p

            className={

              isRecipientOnline

                ? "text-green-400 text-sm"

                : "text-slate-400 text-sm"

            }

          >

            {
              isRecipientOnline
                ? "Online"
                : "Offline"
            }

          </p>


        </div>

      </div>


      {/* =================================================
          MESSAGES
      ================================================= */}

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-900">


        {
          messages?.map(
            (message, index) => (


              <div

                key={
                  message?._id ||
                  index
                }

                ref={scroll}

                className={`flex ${
                  String(
                    message?.senderId
                  ) ===
                  String(
                    user?._id
                  )

                    ? "justify-end"

                    : "justify-start"
                }`}

              >


                <div

                  className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-md ${
                    String(
                      message?.senderId
                    ) ===
                    String(
                      user?._id
                    )

                      ? "bg-blue-500 text-white rounded-br-md"

                      : "bg-slate-700 text-white rounded-bl-md"
                  }`}

                >


                  <p className="text-sm md:text-base break-words">

                    {message.text}

                  </p>


                  <span className="text-xs opacity-70 mt-2 block text-right">

                    {
                      moment(
                        message.createdAt
                      ).calendar()
                    }

                  </span>


                </div>

              </div>

            )
          )
        }


      </div>


      {/* =================================================
          INPUT
      ================================================= */}

      <div className="bg-slate-800 border-t border-slate-700 px-4 py-4 flex items-center gap-3">


        {
          !canSendToTelegram
            ? (

              <p className="flex-1 text-center text-slate-400 text-sm py-2">

                Only the Telegram owner can send messages here.

              </p>

            )
            : (
              <>


        <div className="flex-1 bg-slate-700 rounded-full px-3 py-1">


          <InputEmoji

            value={
              textMessage
            }

            onChange={
              setTextMessage
            }

            fontFamily="Inter"

            borderColor="transparent"

            placeholder="Type a message..."

          />


        </div>


        {/* SEND */}

        <button

          onClick={
            handleSendMessage
          }

          className="
            bg-blue-500
            hover:bg-blue-600
            transition
            duration-200
            p-4
            rounded-full
            text-white
            shadow-lg
          "

          aria-label="Send message"

        >


          <svg

            xmlns="http://www.w3.org/2000/svg"

            width="18"

            height="18"

            fill="currentColor"

            viewBox="0 0 16 16"

          >


            <path
              d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z"
            />


          </svg>


        </button>


              </>
            )
        }


      </div>


    </div>

  );

};


export default ChatBox;