import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config, { saveConfig } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, "../data/config.json");

export default {
  name: "unsudo",
  description: "❌ Remove an owner from the bot",
  category: "Owner",
  ownerOnly: true,

  run: async (kaya, m, args) => {
    try {
      // ================== TARGET ==================
      let target = null;

      // Mention
      if (m.mentionedJid?.length) target = m.mentionedJid[0];
      // Reply
      else if (m.message?.extendedTextMessage?.contextInfo?.participant)
        target = m.message.extendedTextMessage.contextInfo.participant;
      // Written number
      else if (args[0]) target = args[0];

      if (!target) {
        return kaya.sendMessage(
          m.chat,
          { text: "⚠️ Mention a number, reply to a message, or type a number." },
          { quoted: m }
        );
      }

      // ================== CLEAN NUMBER ==================
      const number = target.replace(/\D/g, "");

      if (!number) {
        return kaya.sendMessage(
          m.chat,
          { text: "⚠️ Invalid number." },
          { quoted: m }
        );
      }

      // ================== LOAD CONFIG ==================
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      if (!Array.isArray(data.OWNERS)) data.OWNERS = [];

      // ================== CHECK EXISTENCE ==================
      if (!data.OWNERS.includes(number)) {
        return kaya.sendMessage(
          m.chat,
          { text: `ℹ️ ${number} is not an owner.` },
          { quoted: m }
        );
      }

      // ================== REMOVE ==================
      data.OWNERS = data.OWNERS.filter(n => n !== number);

      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
      saveConfig({ OWNERS: data.OWNERS });

      global.owner = data.OWNERS;

      // ================== CONFIRMATION ==================
      await kaya.sendMessage(
        m.chat,
        { text: `❌ ${number} is no longer an *OWNER* of the bot.` },
        { quoted: m }
      );

    } catch (err) {
      console.error("❌ unsudo error:", err);
      await kaya.sendMessage(
        m.chat,
        { text: "❌ Unable to remove the owner." },
        { quoted: m }
      );
    }
  }
};