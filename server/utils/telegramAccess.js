const telegramConfig = require("../config/telegramConfig");


// TelegramBot's MongoDB user id (the synthetic contact in DialogueX).
const getTelegramBotUserId = () =>
  String(process.env.TELEGRAM_USER_ID || "").trim();


// Only this web user may start/send in the TelegramBot chat.
// Prefer TELEGRAM_OWNER_USER_ID; fall back to telegramConfig.webAppUserId.
const getTelegramOwnerUserId = () =>
  String(
    process.env.TELEGRAM_OWNER_USER_ID ||
      telegramConfig.webAppUserId ||
      ""
  ).trim();


const isTelegramBotUserId = (userId) => {

  const botId = getTelegramBotUserId();

  return (
    Boolean(botId) &&
    String(userId) === botId
  );

};


const isTelegramOwnerUserId = (userId) => {

  const ownerId = getTelegramOwnerUserId();

  return (
    Boolean(ownerId) &&
    String(userId) === ownerId
  );

};


const chatIncludesTelegramBot = (members = []) =>
  members.some((memberId) =>
    isTelegramBotUserId(memberId)
  );


module.exports = {
  getTelegramBotUserId,
  getTelegramOwnerUserId,
  isTelegramBotUserId,
  isTelegramOwnerUserId,
  chatIncludesTelegramBot,
};
