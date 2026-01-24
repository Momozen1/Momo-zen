import fs from "fs";
import path from "path";
import { BOT_NAME } from "../system/botAssets.js";
import checkAdminOrOwner from "../system/checkAdmin.js";

// 📂 Fichier de persistance
const antiBotFile = path.join(process.cwd(), "data/antiBotGroups.json");

// ----------------- Load & Save -----------------
function loadAntiBotGroups() {
  try {
    if (fs.existsSync(antiBotFile)) {
      return JSON.parse(fs.readFileSync(antiBotFile, "utf-8"));
    }
  } catch (err) {
    console.error("❌ Error loading antiBotGroups.json:", err);
  }
  return {};
}

function saveAntiBotGroups() {
  try {
    fs.writeFileSync(
      antiBotFile,
      JSON.stringify(global.antiBotGroups, null, 2)
    );
  } catch (err) {
    console.error("❌ Error saving antiBotGroups.json:", err);
  }
}

// ----------------- Global Init -----------------
if (!global.antiBotGroups) global.antiBotGroups = loadAntiBotGroups();
if (!global.botWarns) global.botWarns = {};
if (!global.messageRate) global.messageRate = {};

// ----------------- Pattern noms bots -----------------
const botPatterns = [
  /^3EB0/, /^4EB0/, /^5EB0/, /^6EB0/, /^7EB0/, /^8EB0/,
  /^9EB0/, /^AEB0/, /^BEB0/, /^CEB0/, /^DEB0/, /^EEB0/,
  /^FEB0/, /^BAE5/, /^BAE7/, /^CAEB0/, /^DAEB0/, /^EAEB0/,
  /^FAEB0/
];

// ----------------- Commande -----------------
export default {
  name: "antibot",
  description: "Anti-bot protection (delete, warn, kick)",
  category: "Groupe",
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, args) => {
    try {
      const chatId = m.chat;
      const action = args[0]?.toLowerCase();

      if (!action || !["on","off","delete","warn","kick","status"].includes(action)) {
        return kaya.sendMessage(chatId, {
          text:
`${BOT_NAME} Anti-Bot Command

.antibot on      → Enable (WARN mode)
.antibot off     → Disable
.antibot delete  → Auto delete bot messages
.antibot warn    → 3 warnings = kick
.antibot kick    → Instant kick
.antibot status  → Show status`
        }, { quoted: m });
      }

      // Status
      if (action === "status") {
        const data = global.antiBotGroups[chatId];
        if (!data?.enabled) return kaya.sendMessage(chatId, { text: `❌ Anti-bot is disabled.` }, { quoted: m });
        return kaya.sendMessage(chatId, { text: `✅ Anti-bot ENABLED\n📊 Mode: ${data.mode.toUpperCase()}` }, { quoted: m });
      }

      // Admin check
      const check = await checkAdminOrOwner(kaya, chatId, m.sender);
      if (!check.isAdminOrOwner) return kaya.sendMessage(chatId, { text: "🚫 Admins only." }, { quoted: m });

      // Actions
      if (action === "on") {
        global.antiBotGroups[chatId] = { enabled: true, mode: "warn" };
        saveAntiBotGroups();
        return kaya.sendMessage(chatId, { text: `✅ Anti-bot enabled (WARN mode)` }, { quoted: m });
      }

      if (action === "off") {
        delete global.antiBotGroups[chatId];
        delete global.botWarns[chatId];
        saveAntiBotGroups();
        return kaya.sendMessage(chatId, { text: `❌ Anti-bot disabled.` }, { quoted: m });
      }

      if (["delete","warn","kick"].includes(action)) {
        global.antiBotGroups[chatId] = { enabled: true, mode: action };
        saveAntiBotGroups();
        return kaya.sendMessage(chatId, { text: `✅ Anti-bot mode set to ${action.toUpperCase()}` }, { quoted: m });
      }

    } catch (err) {
      console.error("❌ antibot.js error:", err);
      kaya.sendMessage(m.chat, { text: "❌ Anti-bot error." }, { quoted: m });
    }
  },

  // ----------------- Détection -----------------
  detect: async (kaya, m) => {
    try {
      if (!m.isGroup || m.key?.fromMe) return;

      const chatId = m.chat;
      const sender = m.sender;

      if (!global.antiBotGroups?.[chatId]?.enabled) return;

      // Ignore admins
      const check = await checkAdminOrOwner(kaya, chatId, sender);
      if (check.isAdminOrOwner) return;

      // Check bot admin
      const metadata = await kaya.groupMetadata(chatId);
      const bot = metadata.participants.find(p => p.id === kaya.user.id);
      if (!bot?.admin) return;

      // Spam / rapidité messages
      const now = Date.now();
      global.messageRate[sender] ??= [];
      global.messageRate[sender].push(now);
      global.messageRate[sender] = global.messageRate[sender].filter(t => now - t < 5000);

      const isBotBySpam = global.messageRate[sender].length >= 6 || m.message?.protocolMessage || m.message?.reactionMessage;

      // Vérification pattern nom bot
      const senderName = m.pushName || '';
      const isBotByName = botPatterns.some(pattern => pattern.test(senderName));

      if (!isBotBySpam && !isBotByName) return;

      const mode = global.antiBotGroups[chatId].mode;

      // Delete message
      await kaya.sendMessage(chatId, { delete: m.key }).catch(() => {});
      if (mode === "delete") return;

      // Kick
      if (mode === "kick") {
        await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
        return;
      }

      // Warn
      if (mode === "warn") {
        global.botWarns[chatId] ??= {};
        global.botWarns[chatId][sender] = (global.botWarns[chatId][sender] || 0) + 1;
        if (global.botWarns[chatId][sender] >= 3) {
          delete global.botWarns[chatId][sender];
          await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
        }
      }

    } catch (err) {
      console.error("❌ AntiBot detect error:", err);
    }
  }
};