const TelegramBot = require("node-telegram-bot-api");
const MessageModel = require("./Models/messageModel");
const { getTelegramOwnerUserId } = require("./utils/telegramAccess");

// ======================================================
// CREATE TELEGRAM BOT
// ======================================================

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

// ======================================================
// ACTIVITY-BASED PRESENCE
// ======================================================
//
// Telegram does NOT expose whether the user closed the
// Telegram desktop/mobile app. Bot process health (getMe /
// polling running) stays up on Render even when the user
// is away — that made TelegramBot always show green Online.
//
// Product rule: Online only after recent Telegram-side
// activity (inbound user message OR successful outbound
// delivery to the linked chat). Auto-expire to Offline
// after TELEGRAM_PRESENCE_TIMEOUT_MS (default 5 minutes).
//
// TelegramBot must NEVER appear in Socket.IO onlineUsers.

const PRESENCE_TIMEOUT_MS = Math.max(
  60_000,
  Number(process.env.TELEGRAM_PRESENCE_TIMEOUT_MS) || 5 * 60 * 1000
);

let telegramBotOnline = false;
let lastActivityAt = 0;
let presenceExpireTimer = null;

const setTelegramBotStatus = (status) => {
  const nextStatus = Boolean(status);

  if (telegramBotOnline === nextStatus) {
    return;
  }

  telegramBotOnline = nextStatus;

  console.log(
    "Telegram Bot Status:",
    nextStatus ? "ONLINE" : "OFFLINE",
    `(activity presence, timeout ${PRESENCE_TIMEOUT_MS}ms)`
  );

  if (global.io) {
    global.io.emit("telegramBotStatus", telegramBotOnline);
  }
};

const clearPresenceTimer = () => {
  if (presenceExpireTimer) {
    clearTimeout(presenceExpireTimer);
    presenceExpireTimer = null;
  }
};

const schedulePresenceExpiry = () => {
  clearPresenceTimer();

  presenceExpireTimer = setTimeout(() => {
    presenceExpireTimer = null;
    console.log(
      "Telegram Bot presence expired after inactivity"
    );
    setTelegramBotStatus(false);
  }, PRESENCE_TIMEOUT_MS);

  if (typeof presenceExpireTimer.unref === "function") {
    presenceExpireTimer.unref();
  }
};

/**
 * Mark recent Telegram activity → Online, reset inactivity timer.
 * Call on inbound Telegram messages and successful outbound sends.
 */
const markActivity = (reason = "activity") => {
  lastActivityAt = Date.now();
  console.log(`Telegram Bot activity: ${reason}`);
  setTelegramBotStatus(true);
  schedulePresenceExpiry();
};

const emitCurrentStatus = (targetSocket) => {
  if (targetSocket) {
    targetSocket.emit("telegramBotStatus", telegramBotOnline);
    return;
  }

  if (global.io) {
    global.io.emit("telegramBotStatus", telegramBotOnline);
  }
};

const getOnlineStatus = () => telegramBotOnline;

const getPresenceInfo = () => ({
  online: telegramBotOnline,
  lastActivityAt: lastActivityAt || null,
  timeoutMs: PRESENCE_TIMEOUT_MS,
});

// ======================================================
// POLLING / BOT ERRORS (log only — do not drive presence)
// ======================================================

bot.on("polling_error", (error) => {
  console.log("Telegram polling error:", error.message);
});

bot.on("error", (error) => {
  console.log("Telegram bot error:", error.message);
});

// ======================================================
// TELEGRAM MESSAGE RECEIVED → ACTIVITY
// ======================================================

bot.on("message", async (msg) => {
  try {
    // Inbound message from the Telegram user = recent activity.
    markActivity("inbound Telegram message");

    const telegramText = msg.text;

    if (!telegramText) {
      return;
    }

    // Dileep <-> TelegramBot MongoDB chat ID
    const chatId = "6a0827f66fed1f6fc7c4ee02";

    // TelegramBot MongoDB user ID
    const senderId = process.env.TELEGRAM_USER_ID;

    const newMessage = new MessageModel({
      chatId,
      senderId,
      text: telegramText,
    });

    const savedMessage = await newMessage.save();

    if (global.io) {
      // Live open-chat append for the TelegramBot conversation
      global.io.emit("telegramMessage", savedMessage);

      // Unread badge / header total — same event as normal
      // web→web messages (ChatContext listens for getNotification).
      // Target only the DialogueX owner (dileep), not every client.
      const ownerId = getTelegramOwnerUserId();

      if (
        ownerId &&
        typeof global.emitToUser === "function"
      ) {
        global.emitToUser(
          ownerId,
          "getNotification",
          {
            senderId,
            isRead: false,
            date: new Date(),
            text: telegramText,
          }
        );
      }
    }

    await bot.sendMessage(
      msg.chat.id,
      "Message delivered to DDWorld"
    );
  } catch (error) {
    console.log("Telegram Error:", error.message);
  }
});

// ======================================================
// STATUS HELPERS (used by server/index.js)
// ======================================================

bot.getOnlineStatus = getOnlineStatus;
bot.getPresenceInfo = getPresenceInfo;
bot.markActivity = markActivity;
bot.setOnlineStatus = setTelegramBotStatus;
bot.emitCurrentStatus = emitCurrentStatus;
bot.markOffline = () => {
  clearPresenceTimer();
  lastActivityAt = 0;
  setTelegramBotStatus(false);
};

// ======================================================
// PROCESS SHUTDOWN → OFFLINE
// ======================================================

const markOfflineOnShutdown = () => {
  bot.markOffline();
};

process.once("SIGINT", markOfflineOnShutdown);
process.once("SIGTERM", markOfflineOnShutdown);

module.exports = bot;
