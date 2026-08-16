import {
  useContext,
  useEffect,
  useState,
} from "react";

import {
  useFetchRecipientUser,
} from "../../hooks/useFetchRecipient";

import avatar from "../../assets/avatar.jpg";

import {
  ChatContext,
} from "../../context/ChatContext";

import {
  unreadNotificationsFunc,
} from "../../utils/unreadNotifications";

import useFetchLatestMessage from "../../hooks/useFetchLatestMessage";

import moment from "moment";


const UserChat = ({
  chat,
  user,
}) => {


  // ====================================================
  // RECIPIENT
  // ====================================================

  const {
    recipientUser,
  } =
    useFetchRecipientUser(
      chat,
      user
    );


  // ====================================================
  // CHAT CONTEXT
  // ====================================================

  const {

    onlineUsers,

    telegramBotOnline,

    TELEGRAM_USER_ID,

    notifications,

    markThisUserNotificationsAsRead,

  } =
    useContext(
      ChatContext
    );


  // ====================================================
  // LATEST MESSAGE
  // ====================================================

  const {
    latestMessage,
  } =
    useFetchLatestMessage(
      chat
    );


  // ====================================================
  // REFRESH RELATIVE MESSAGE TIME
  // ====================================================

  const [
    ,
    setNow,
  ] =
    useState(
      Date.now()
    );


  useEffect(
    () => {


      const interval =
        setInterval(
          () => {

            setNow(
              Date.now()
            );

          },
          60000
        );


      return () =>
        clearInterval(
          interval
        );


    },
    []
  );


  // ====================================================
  // NOTIFICATIONS
  // ====================================================

  const unreadNotifications =
    unreadNotificationsFunc(
      notifications
    );


  const thisUserNotifications =
    unreadNotifications?.filter(

      (notification) =>

        String(
          notification.senderId
        ) ===
        String(
          recipientUser?._id
        )

    );


  // ====================================================
  // CHECK IF RECIPIENT IS TELEGRAM BOT
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


  // ====================================================
  // NORMAL WEB USER ONLINE STATUS
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
  // FINAL ONLINE STATUS
  // ====================================================

  // TelegramBot must NEVER use Socket.IO onlineUsers.
  // Only activity-based telegramBotOnline / telegramBotStatus.

  const isOnline =
    isTelegramBot
      ? Boolean(
          telegramBotOnline
        )
      : normalUserOnline;


  // ====================================================
  // TRUNCATE MESSAGE
  // ====================================================

  const truncateText =
    (text) => {


      if (!text) {

        return "";

      }


      let shortText =
        text.substring(
          0,
          25
        );


      if (
        text.length > 25
      ) {

        shortText =
          shortText + "...";

      }


      return shortText;

    };


  // ====================================================
  // UI
  // ====================================================

  return (

    <div

      className="
        flex
        items-center
        justify-between
        p-4
        hover:bg-slate-800
        transition
        duration-200
        rounded-2xl
        cursor-pointer
        border-b
        border-slate-700
      "

      onClick={() => {


        if (
          thisUserNotifications?.length !==
          0
        ) {


          markThisUserNotificationsAsRead(
            thisUserNotifications,
            notifications
          );

        }

      }}

    >


      {/* =================================================
          LEFT
      ================================================= */}

      <div className="flex items-center gap-4">


        {/* AVATAR */}

        <div className="relative">

          <img

            src={avatar}

            alt={
              `${recipientUser?.name || "User"} avatar`
            }

            className="
              w-14
              h-14
              rounded-full
              object-cover
              border-2
              border-slate-600
            "

          />


          {/* ONLINE DOT */}

          {isOnline && (

            <div
              className="
                absolute
                bottom-0
                right-0
                w-3
                h-3
                bg-green-500
                rounded-full
                border-2
                border-slate-900
              "
            />

          )}

        </div>


        {/* USER INFO */}

        <div className="flex flex-col">


          <h2 className="text-white font-semibold text-lg">

            {recipientUser?.name}

          </h2>


          <p className="text-slate-400 text-sm max-w-[180px] truncate">

            {
              latestMessage?.text

                ? truncateText(
                    latestMessage.text
                  )

                : "Start chatting..."
            }

          </p>


        </div>

      </div>


      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="flex flex-col items-end gap-2">


        {/* TIME */}

        <span className="text-slate-500 text-xs">

          {
            latestMessage?.createdAt

              ? moment(
                  latestMessage.createdAt
                ).fromNow()

              : ""
          }

        </span>


        {/* NOTIFICATION */}

        {
          thisUserNotifications?.length >
            0 && (

            <div
              className="
                bg-blue-500
                text-white
                text-xs
                w-5
                h-5
                rounded-full
                flex
                items-center
                justify-center
              "
            >

              {
                thisUserNotifications.length
              }

            </div>

          )
        }

      </div>

    </div>

  );

};


export default UserChat;