// ================= commands/removebg.js ====================
import axios from "axios";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { uploadImage } from "../lib/uploadImage.js";

async function getQuotedOrOwnImageUrl(sock, message) {
  // 1️⃣ Image citée (priorité)
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage) {
    const stream = await downloadContentFromMessage(quoted.imageMessage, "image");
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    return await uploadImage(buffer);
  }

  // 2️⃣ Image envoyée directement
  if (message.message?.imageMessage) {
    const stream = await downloadContentFromMessage(message.message.imageMessage, "image");
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    return await uploadImage(buffer);
  }

  return null;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

export default {
  name: "removebg",
  alias: ["rmbg", "nobg"],
  category: "Image",
  description: "Supprime le fond d'une image",
  usage: ".removebg <image_url> | reply image",

  async execute(sock, m, args) {
    const chatId = m.chat;

    try {
      let imageUrl;

      // 🌐 URL fournie
      if (args.length > 0) {
        const url = args.join(" ");
        if (!isValidUrl(url)) {
          return sock.sendMessage(
            chatId,
            { text: "❌ URL invalide.\nEx: `.removebg https://image.jpg`" },
            { quoted: m }
          );
        }
        imageUrl = url;
      } 
      // 🖼️ Image envoyée ou reply
      else {
        imageUrl = await getQuotedOrOwnImageUrl(sock, m);
        if (!imageUrl) {
          return sock.sendMessage(
            chatId,
            {
              text:
                "📸 *Remove Background*\n\n" +
                "• Reply à une image avec `.removebg`\n" +
                "• Ou `.removebg <url_image>`"
            },
            { quoted: m }
          );
        }
      }

      // ✅ API REMOVE BG STABLE
      const apiUrl = `https://api.axyz.my.id/api/removebg?url=${encodeURIComponent(imageUrl)}`;
      const response = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        timeout: 30000
      });

      // 🧠 Sécurité : l’API doit renvoyer une image
      if (!response.headers["content-type"]?.includes("image")) {
        throw new Error("API did not return an image");
      }

      await sock.sendMessage(
        chatId,
        {
          image: response.data,
          caption: "✨ *Fond supprimé avec succès !*\n\n𝗞𝗔𝗬𝗔-𝗠𝗗"
        },
        { quoted: m }
      );

    } catch (error) {
      console.error("[REMOVEBG ERROR]", error);

      let msg = "❌ Impossible de supprimer le fond.";
      if (error.code === "ECONNABORTED") msg = "⏰ Timeout. Réessaie.";
      if (error.response?.status === 429) msg = "🚦 Trop de requêtes. Attends un peu.";
      if (error.message.includes("image")) msg = "❌ Image invalide.";

      await sock.sendMessage(chatId, { text: msg }, { quoted: m });
    }
  }
};