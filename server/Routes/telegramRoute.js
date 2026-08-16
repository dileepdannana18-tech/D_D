const express = require("express");

const router = express.Router();

const bot = require("../telegramBot");

const {
  isTelegramOwnerUserId,
} = require("../utils/telegramAccess");


router.post(
  "/send",
  async (req, res) => {

    const {
      message,
      senderId,
    } = req.body;


    if (
      !isTelegramOwnerUserId(senderId)
    ) {

      return res.status(403).json({
        success: false,
        message:
          "Only the Telegram owner can send messages to Telegram.",
      });

    }


    await bot.sendMessage(
      process.env.TELEGRAM_CHAT_ID,
      message
    );


    if (typeof bot.markActivity === "function") {
      bot.markActivity("outbound /api/telegram/send");
    }


    res.json({
      success: true,
    });

  }
);


module.exports = router;
