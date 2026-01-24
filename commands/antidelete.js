// ==================== commands/antidelete.js ====================
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { writeFile } from "fs/promises";

const messageStore = new Map();
const CONFIG_PATH = path.join(process.cwd(), "data/antidelete.json");
const TEMP_MEDIA_DIR = path.join(process.cwd(), "tmp");

// Assure tmp dir exists
if (!fs.existsSync(TEMP_MEDIA_DIR)) fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });

// 🔹 Get folder size in MB
const getFolderSizeInMB = folderPath => {
  try {
    const files = fs.readdirSync(folderPath);
    let totalSize = 0;
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      if (fs.statSync(filePath).isFile()) totalSize += fs.statSync(filePath).size;
    }
    return totalSize / (1024 * 1024);
  } catch { return 0; }
};

// 🔹 Clean temp if >200MB
const cleanTempFolderIfLarge = () => {
  try {
    if (getFolderSizeInMB(TEMP_MEDIA_DIR) > 200) {
      fs.readdirSync(TEMP_MEDIA_DIR).forEach(f => fs.unlinkSync(path.join(TEMP_MEDIA_DIR, f)));
    }
  } catch (err) { console.error("Temp cleanup error:", err); }
};
setInterval(cleanTempFolderIfLarge, 60 * 1000);

// 🔹 Load / Save config
const loadConfig = () => {
  if (!fs.existsSync(CONFIG_PATH)) return { enabled: false };
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH)); } catch { return { enabled: false }; }
};

const saveConfig = (config) => {
  try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)); } catch (err) { console.error(err); }
};

// 🔹 Command Handler
export default {
  name: "antidelete",
  description: "🛡️ Active/Désactive l'anti-suppression de messages",
  category: "Owner",
  ownerOnly: true,

  run: async (sock, m, args) => {
    const action = args[0]?.toLowerCase();
    const config = loadConfig();

    if (!action || !["on", "off"].includes(action)) {
      return sock.sendMessage(
        m.chat,
        {
          text: `*ANTIDELETE STATUS*\nCurrent: ${config.enabled ? "✅ Enabled" : "❌ Disabled"}\n\nUsage:\n.antidelete on\n.antidelete off`
        },
        { quoted: m }
      );
    }

    config.enabled = action === "on";
    saveConfig(config);
    return sock.sendMessage(
      m.chat,
      { text: `*Antidelete ${config.enabled ? "Enabled ✅" : "Disabled ❌"}*` },
      { quoted: m }
    );
  }
};

// 🔹 Store incoming messages
export async function storeMessage(sock, message) {
  try {
    const config = loadConfig();
    if (!config.enabled) return;
    if (!message.key?.id) return;

    const messageId = message.key.id;
    let content = "", mediaType = "", mediaPath = "";
    const sender = message.key.participant || message.key.remoteJid;
    let isViewOnce = false;

    const viewOnceContainer = message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;
    if (viewOnceContainer) {
      // Unwrap view-once
      if (viewOnceContainer.imageMessage) {
        mediaType = "image";
        content = viewOnceContainer.imageMessage.caption || "";
        const buffer = await downloadContentFromMessage(viewOnceContainer.imageMessage, "image");
        mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
        await writeFile(mediaPath, buffer);
        isViewOnce = true;
      } else if (viewOnceContainer.videoMessage) {
        mediaType = "video";
        content = viewOnceContainer.videoMessage.caption || "";
        const buffer = await downloadContentFromMessage(viewOnceContainer.videoMessage, "video");
        mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
        await writeFile(mediaPath, buffer);
        isViewOnce = true;
      }
    } else if (message.message?.conversation) {
      content = message.message.conversation;
    } else if (message.message?.extendedTextMessage?.text) {
      content = message.message.extendedTextMessage.text;
    } else if (message.message?.imageMessage) {
      mediaType = "image";
      content = message.message.imageMessage.caption || "";
      const buffer = await downloadContentFromMessage(message.message.imageMessage, "image");
      mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
      await writeFile(mediaPath, buffer);
    } else if (message.message?.stickerMessage) {
      mediaType = "sticker";
      const buffer = await downloadContentFromMessage(message.message.stickerMessage, "sticker");
      mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.webp`);
      await writeFile(mediaPath, buffer);
    } else if (message.message?.videoMessage) {
      mediaType = "video";
      content = message.message.videoMessage.caption || "";
      const buffer = await downloadContentFromMessage(message.message.videoMessage, "video");
      mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
      await writeFile(mediaPath, buffer);
    } else if (message.message?.audioMessage) {
      mediaType = "audio";
      const mime = message.message.audioMessage.mimetype || "";
      const ext = mime.includes("mpeg") ? "mp3" : mime.includes("ogg") ? "ogg" : "mp3";
      const buffer = await downloadContentFromMessage(message.message.audioMessage, "audio");
      mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);
      await writeFile(mediaPath, buffer);
    }

    messageStore.set(messageId, { content, mediaType, mediaPath, sender, group: message.key.remoteJid.endsWith("@g.us") ? message.key.remoteJid : null, timestamp: new Date().toISOString() });

    // Forward view-once to owner immediately
    if (isViewOnce && mediaType && fs.existsSync(mediaPath)) {
      try {
        const ownerNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const senderName = sender.split("@")[0];
        const mediaOptions = { caption: `*Anti-ViewOnce ${mediaType}*\nFrom: @${senderName}`, mentions: [sender] };
        if (mediaType === "image") await sock.sendMessage(ownerNumber, { image: { url: mediaPath }, ...mediaOptions });
        if (mediaType === "video") await sock.sendMessage(ownerNumber, { video: { url: mediaPath }, ...mediaOptions });
        try { fs.unlinkSync(mediaPath); } catch {}
      } catch {}
    }

  } catch (err) { console.error("storeMessage error:", err); }
}

// 🔹 Handle deleted messages
export async function handleMessageRevocation(sock, revocationMessage) {
  try {
    const config = loadConfig();
    if (!config.enabled) return;

    const messageId = revocationMessage.message.protocolMessage.key.id;
    const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;
    const ownerNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    if (deletedBy.includes(sock.user.id) || deletedBy === ownerNumber) return;

    const original = messageStore.get(messageId);
    if (!original) return;

    const sender = original.sender;
    const senderName = sender.split("@")[0];
    const groupName = original.group ? (await sock.groupMetadata(original.group)).subject : "";

    let text = `*🔰 ANTIDELETE REPORT 🔰*\n\n*🗑️ Deleted By:* @${deletedBy.split("@")[0]}\n*👤 Sender:* @${senderName}\n*📱 Number:* ${sender}\n`;
    if (groupName) text += `*👥 Group:* ${groupName}\n`;
    if (original.content) text += `\n*💬 Deleted Message:*\n${original.content}`;

    await sock.sendMessage(ownerNumber, { text, mentions: [deletedBy, sender] });

    if (original.mediaType && fs.existsSync(original.mediaPath)) {
      const mediaOptions = { caption: `*Deleted ${original.mediaType}*\nFrom: @${senderName}`, mentions: [sender] };
      try {
        switch (original.mediaType) {
          case "image": await sock.sendMessage(ownerNumber, { image: { url: original.mediaPath }, ...mediaOptions }); break;
          case "sticker": await sock.sendMessage(ownerNumber, { sticker: { url: original.mediaPath }, ...mediaOptions }); break;
          case "video": await sock.sendMessage(ownerNumber, { video: { url: original.mediaPath }, ...mediaOptions }); break;
          case "audio": await sock.sendMessage(ownerNumber, { audio: { url: original.mediaPath }, mimetype: "audio/mpeg", ptt: false, ...mediaOptions }); break;
        }
      } catch (err) { await sock.sendMessage(ownerNumber, { text: `⚠️ Error sending media: ${err.message}` }); }
      try { fs.unlinkSync(original.mediaPath); } catch {}
    }

    messageStore.delete(messageId);

  } catch (err) { console.error("handleMessageRevocation error:", err); }
}