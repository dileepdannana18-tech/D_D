const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const userRoute = require("./Routes/userRoute");
const chatRoute = require("./Routes/chatRoute");
const messageRoute = require("./Routes/messageRoute");
const telegramRoute = require("./Routes/telegramRoute");
const {
  isTelegramBotUserId,
  isTelegramOwnerUserId,
} = require("./utils/telegramAccess");

const app = express();
// const bot = require("./telegramBot");


// ======================================================
// ALLOWED FRONTEND ORIGINS
// ======================================================

const allowedOrigins = [
  "http://localhost:5173",

  // IMPORTANT:
  // Keep this only if this is your actual Vercel URL.
  "https://dialogue-x.vercel.app",
];


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  express.json()
);


app.use(
  cors({

    origin: allowedOrigins,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
    ],

    credentials: true,

  })
);


// ======================================================
// ROUTES
// ======================================================

app.use(
  "/api/users",
  userRoute
);

app.use(
  "/api/chats",
  chatRoute
);

app.use(
  "/api/messages",
  messageRoute
);

app.use(
  "/api/telegram",
  telegramRoute
);


app.get(
  "/",
  (req, res) => {

    res.send(
      "welcome our chat app APIS .."
    );

  }
);


// ======================================================
// CONFIGURATION
// ======================================================

const port =
  process.env.PORT || 3000;

const uri =
  process.env.ATLAS_URI;


// ======================================================
// HTTP SERVER
// ======================================================

const server =
  http.createServer(app);


// ======================================================
// SOCKET.IO
// ======================================================

const io =
  new Server(
    server,
    {

      cors: {

        origin:
          allowedOrigins,

        methods: [
          "GET",
          "POST",
        ],

        credentials:
          true,

      },

    }
  );


// ======================================================
// ONLINE WEB USERS
// ======================================================

// Normal DialogueX users are tracked here.
//
// A single user can have multiple sockets,
// for example multiple browser tabs.

let onlineUsers = [];


// Make Socket.IO + targeted emit available to telegramBot.js
// BEFORE requiring the bot (polling can deliver immediately).
global.io = io;

// Used by telegramBot.js so inbound Telegram → DialogueX
// messages can notify the owner the same way sendMessage
// notifies a normal web recipient (getNotification).
global.emitToUser = (userId, event, payload) => {
  if (!userId || !event || !global.io) {
    return;
  }

  const recipients = onlineUsers.filter(
    (onlineUser) =>
      String(onlineUser.userId) === String(userId)
  );

  if (recipients.length === 0) {
    console.log(
      "emitToUser: no online sockets for",
      userId,
      event
    );
    return;
  }

  recipients.forEach((recipient) => {
    io.to(recipient.socketId).emit(event, payload);
  });
};

const bot = require("./telegramBot");


// ======================================================
// SOCKET EVENTS
// ======================================================

io.on(
  "connection",
  (socket) => {


    console.log(
      "New socket connection:",
      socket.id
    );


    // ==================================================
    // SEND CURRENT TELEGRAM STATUS (activity-based)
    // ==================================================

    // Online only after recent Telegram activity, not
    // because the Render bot process / polling is healthy.

    socket.emit(
      "telegramBotStatus",
      bot.getOnlineStatus()
    );


    socket.on(
      "getTelegramBotStatus",
      () => {

        socket.emit(
          "telegramBotStatus",
          bot.getOnlineStatus()
        );

      }
    );


    // ==================================================
    // ADD NORMAL WEB USER
    // ==================================================

    socket.on(
      "addNewUser",
      (userId) => {


        if (!userId) {

          return;

        }


        const normalizedUserId =
          String(userId);


        // TelegramBot is not a Socket.IO web user.
        // Its presence comes only from telegramBotStatus.

        if (
          isTelegramBotUserId(
            normalizedUserId
          )
        ) {

          console.log(
            "Ignored addNewUser for TelegramBot user id"
          );

          return;

        }


        const socketAlreadyExists =
          onlineUsers.some(

            (onlineUser) =>

              String(
                onlineUser.userId
              ) ===
                normalizedUserId &&

              onlineUser.socketId ===
                socket.id

          );


        if (!socketAlreadyExists) {

          onlineUsers.push({

            userId:
              normalizedUserId,

            socketId:
              socket.id,

          });

        }


        socket.userId =
          normalizedUserId;


        console.log(
          "Online users:",
          onlineUsers
        );


        io.emit(
          "getOnlineUsers",
          onlineUsers.filter(
            (onlineUser) =>
              !isTelegramBotUserId(
                onlineUser.userId
              )
          )
        );

      }
    );


    // ==================================================
    // SEND MESSAGE
    // ==================================================

    socket.on(
      "sendMessage",
      async (message) => {


        if (!message) {

          return;

        }


        if (
          !message.recipientId
        ) {

          console.log(
            "sendMessage ignored: missing recipientId"
          );

          return;

        }


        const recipientId =
          String(
            message.recipientId
          );


        console.log(
          "Recipient:",
          recipientId
        );


        // =================================================
        // NORMAL WEB RECIPIENT
        // =================================================

        const recipients =
          onlineUsers.filter(

            (onlineUser) =>

              String(
                onlineUser.userId
              ) ===
              recipientId

          );


        if (
          recipients.length ===
          0
        ) {

          console.log(
            "No online sockets for recipient:",
            recipientId
          );

        }


        recipients.forEach(
          (recipient) => {


            // Send real-time message

            io.to(
              recipient.socketId
            ).emit(
              "getMessage",
              message
            );


            // Send notification

            io.to(
              recipient.socketId
            ).emit(
              "getNotification",
              {

                senderId:
                  message.senderId,

                isRead:
                  false,

                date:
                  new Date(),

              }
            );

          }
        );


        // =================================================
        // TELEGRAM RECIPIENT (owner only)
        // =================================================

        if (
          isTelegramBotUserId(
            recipientId
          )
        ) {

          const senderId =
            String(
              message.senderId || ""
            );


          if (
            !isTelegramOwnerUserId(
              senderId
            )
          ) {

            console.log(
              "Telegram send blocked: sender is not the Telegram owner"
            );

          } else {

            try {

              console.log(
                "Telegram chat detected"
              );


              console.log(
                "Sending:",
                message.text
              );


              await bot.sendMessage(
                process.env.TELEGRAM_CHAT_ID,
                message.text
              );


              console.log(
                "Telegram message sent successfully"
              );


              // Successful delivery to Telegram counts
              // as recent activity for presence.

              if (
                typeof bot.markActivity ===
                "function"
              ) {

                bot.markActivity(
                  "outbound DialogueX → Telegram"
                );

              }

            } catch (error) {

              console.log(
                "Telegram send error:",
                error.message
              );

              // Do not force Offline on a single send
              // failure — presence expires on inactivity.

            }

          }

        }

      }
    );


    // ==================================================
    // DISCONNECT
    // ==================================================

    socket.on(
      "disconnect",
      (reason) => {


        console.log(
          "Socket disconnected:",
          socket.id
        );


        console.log(
          "Reason:",
          reason
        );


        // Remove only this socket.

        onlineUsers =
          onlineUsers.filter(

            (onlineUser) =>

              onlineUser.socketId !==
              socket.id

          );


        console.log(
          "Online users after disconnect:",
          onlineUsers
        );


        io.emit(
          "getOnlineUsers",
          onlineUsers.filter(
            (onlineUser) =>
              !isTelegramBotUserId(
                onlineUser.userId
              )
          )
        );

      }
    );

  }
);


// ======================================================
// START SERVER
// ======================================================

server.listen(
  port,
  () => {

    console.log(
      `server running on port:${port}`
    );

  }
);


// ======================================================
// MONGODB
// ======================================================

mongoose
  .connect(uri)

  .then(() => {

    console.log(
      "MongoDB connection established"
    );

  })

  .catch((error) => {

    console.log(
      "MongoDB connection failed:",
      error.message
    );

  });