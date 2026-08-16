const chatModel = require("../Models/chatModel");

const {
  isTelegramBotUserId,
  isTelegramOwnerUserId,
} = require("../utils/telegramAccess");

// createChat
// findUserChats
// findChat

const createChat = async (req, res) => {
  const { firstId, secondId } = req.body;

  try {
    if (
      isTelegramBotUserId(firstId) ||
      isTelegramBotUserId(secondId)
    ) {
      const otherId =
        isTelegramBotUserId(firstId)
          ? secondId
          : firstId;

      if (
        !isTelegramOwnerUserId(otherId)
      ) {
        return res.status(403).json({
          message:
            "Only the Telegram owner can start a chat with TelegramBot.",
        });
      }
    }

    const chat = await chatModel.findOne({
      members: { $all: [firstId, secondId] },
    });

    if (chat) return res.status(200).json(chat);

    const newChat = new chatModel({
      members: [firstId, secondId],
    });
    const response = await newChat.save();

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const findUserChats = async (req, res) => {
  const userId = req.params.userId;

  try {
    let chats = await chatModel.find({
      members: { $in: [userId] },
    });

    // Non-owners must not receive TelegramBot chats in their list.
    if (!isTelegramOwnerUserId(userId)) {
      chats = chats.filter(
        (chat) =>
          !chat.members.some((memberId) =>
            isTelegramBotUserId(memberId)
          )
      );
    }

    res.status(200).json(chats);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const findChat = async (req, res) => {
  const { firstId, secondId } = req.params;

  try {
    const chat = await chatModel.findOne({
      members: { $all: [firstId, secondId] },
    });

    res.status(200).json(chat);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

module.exports = { createChat, findUserChats, findChat };
