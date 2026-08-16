const axios = require("axios");

const BOT_TOKEN = "8970474280:AAGU7xa8vuPtCUC0CsVoOtW_RJJ5qfx2BNk";
const CHAT_ID = "5419141203";

const sendTelegramNotification = async (message) => {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    await axios.post(url, {
      chat_id: CHAT_ID,
      text: message,
    });

    console.log("Telegram notification sent");
  } catch (error) {
    console.log("Telegram error:", error.message);
  }
};

module.exports = sendTelegramNotification;