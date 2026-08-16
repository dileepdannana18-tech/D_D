// Stable DialogueX ↔ Telegram mapping.
// Override with env when needed:
//   TELEGRAM_CHAT_ID, TELEGRAM_USER_ID, TELEGRAM_OWNER_USER_ID
const TELEGRAM_USER_MAP = {
  telegramChatId: "5419141203",
  // dileep — only this web user may message TelegramBot from the app
  webAppUserId: "6a001784c7c73a1aef7fe480",
};

module.exports = TELEGRAM_USER_MAP;