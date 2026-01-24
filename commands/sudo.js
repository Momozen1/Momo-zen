import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config, { saveConfig } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, "../data/config.json");

export default {
  name: "sudo",
  description: "👑 Add an owner to the bot",
  category: "Owner",
  ownerOnly: true,

  run: async (kaya, m, args) => {
    try {
      let target = null;

      // Mention
      if (m.mentionedJid?.length) target = m.mentionedJid[0];
      // Reply
      else if (m.message?.extendedTextMessage?.contextInfo?.participant) target = m.message.extendedTextMessage.contextInfo.participant;
      // Written number
      else if (args[0]) {
        // Ajoute le suffixe @s.whatsapp.net si nécessaire
        target = args[0].includes("@") ? args[0] : `${args[0]}@s.whatsapp.net`;
      }

      if (!target) {
        return kaya.sendMessage(
          m.chat,
          { text: "⚠️ Mention a number, reply to a message, or type a number." },
          { quoted: m }
        );
      }

      // Nettoyer le numéro pour le stockage (digits only)
      const number = target.replace(/\D/g, "");

      if (!number) {
        return kaya.sendMessage(
          m.chat,
          { text: "⚠️ Invalid number." },
          { quoted: m }
        );
      }

      // Charger la config
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (!Array.isArray(data.OWNERS)) data.OWNERS = [];

      // Vérifier si déjà owner
      if (data.OWNERS.includes(number)) {
        return kaya.sendMessage(
          m.chat,
          { text: `ℹ️ ${number} is already an owner.` },
          { quoted: m }
        );
      }

      // Ajouter owner
      data.OWNERS.push(number);
      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
      saveConfig({ OWNERS: data.OWNERS });
      global.owner = data.OWNERS;

      // ✅ Confirmation avec mention lisible dans WhatsApp
      const jid = `${number}@s.whatsapp.net`;
      await kaya.sendMessage(
        m.chat,
        {
          text: `✅ Added as BOT OWNER`,
          mentions: [jid]
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("❌ sudo error:", err);
      await kaya.sendMessage(
        m.chat,
        { text: "❌ Failed to add the owner." },
        { quoted: m }
      );
    }
  }
};