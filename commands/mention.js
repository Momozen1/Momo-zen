import fs from "fs";
import path from "path";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

function loadState() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "data", "mention.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return { enabled: false, type: "text", assetPath: "" };
  }
}

function saveState(state) {
  fs.writeFileSync(path.join(process.cwd(), "data", "mention.json"), JSON.stringify(state, null, 2));
}

export default {
  name: "mention",
  description: "Enable/Disable automatic replies to mentions and customize the message.",
  category: "Owner",
  owner: true, // Only owners can use it
  usage: ".mention on|off / .setmention (reply to a message or media)",

  async execute(kaya, m, args) {
    try {
      const chatId = m.chat;
      const subCommand = args[0]?.toLowerCase();

      // =================== TOGGLE ON/OFF ===================
      if (subCommand === "on" || subCommand === "off") {
        if (!m.fromMe && !m.isOwner) {
          return kaya.sendMessage(chatId, { text: "🚫 Only owners can enable or disable this command." }, { quoted: m });
        }
        const state = loadState();
        state.enabled = subCommand === "on";
        saveState(state);
        return kaya.sendMessage(chatId, { text: `✅ Mention reply ${state.enabled ? "enabled" : "disabled"}.` }, { quoted: m });
      }

      // =================== SET MESSAGE / MEDIA ===================
      if (subCommand === "setmention") {
        if (!m.fromMe && !m.isOwner) {
          return kaya.sendMessage(chatId, { text: "🚫 Only owners can set the mention reply message." }, { quoted: m });
        }

        const ctx = m.message?.extendedTextMessage?.contextInfo;
        const qMsg = ctx?.quotedMessage;
        if (!qMsg) return kaya.sendMessage(chatId, { text: "⚠️ Reply to a message or media to set the mention reply." }, { quoted: m });

        let type = "sticker", buf, dataType;

        if (qMsg.stickerMessage) { dataType = "stickerMessage"; type = "sticker"; }
        else if (qMsg.imageMessage) { dataType = "imageMessage"; type = "image"; }
        else if (qMsg.videoMessage) { dataType = "videoMessage"; type = "video"; }
        else if (qMsg.audioMessage) { dataType = "audioMessage"; type = "audio"; }
        else if (qMsg.documentMessage) { dataType = "documentMessage"; type = "file"; }
        else if (qMsg.conversation || qMsg.extendedTextMessage?.text) type = "text";
        else return kaya.sendMessage(chatId, { text: "⚠️ Unsupported type." }, { quoted: m });

        if (type === "text") buf = Buffer.from(qMsg.conversation || qMsg.extendedTextMessage?.text || "", "utf8");
        else {
          const stream = await downloadContentFromMessage(qMsg[dataType], type === "sticker" ? "sticker" : type);
          const chunks = [];
          for await (const chunk of stream) chunks.push(chunk);
          buf = Buffer.concat(chunks);
        }

        if (buf.length > 1024 * 1024) return kaya.sendMessage(chatId, { text: "⚠️ File too large. Max 1MB." }, { quoted: m });

        const assetsDir = path.join(process.cwd(), "assets");
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

        // Remove old files
        fs.readdirSync(assetsDir).forEach(f => { if (f.startsWith("mention_custom.")) fs.unlinkSync(path.join(assetsDir, f)); });

        let ext = "bin", mimetype = "", ptt = false, gifPlayback = false;
        if (type === "sticker") ext = "webp";
        else if (type === "image") ext = mimetype.includes("png") ? "png" : "jpg";
        else if (type === "video") { ext = "mp4"; gifPlayback = !!qMsg.videoMessage?.gifPlayback; }
        else if (type === "audio") { ptt = !!qMsg.audioMessage?.ptt; ext = mimetype.includes("ogg") ? "ogg" : "mp3"; }
        else if (type === "text") ext = "txt";

        const outName = `mention_custom.${ext}`;
        const outPath = path.join(assetsDir, outName);
        fs.writeFileSync(outPath, buf);

        const state = loadState();
        state.assetPath = path.join("assets", outName);
        state.type = type;
        if (type === "audio") { state.mimetype = mimetype; state.ptt = ptt; }
        if (type === "video") state.gifPlayback = gifPlayback;

        saveState(state);
        return kaya.sendMessage(chatId, { text: "✅ Mention reply updated." }, { quoted: m });
      }

      // =================== DEFAULT: HELP ===================
      return kaya.sendMessage(chatId, { text: "⚙️ Usage:\n.mention on|off\n.setmention (reply to a message or media)" }, { quoted: m });

    } catch (err) {
      console.error("❌ mention command error:", err);
      return kaya.sendMessage(m.chat, { text: "⚠️ An error occurred." }, { quoted: m });
    }
  }
};