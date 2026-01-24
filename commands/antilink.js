// ==================== commands/antilink.js ====================
import fs from "fs";
import path from "path";
import checkAdminOrOwner from "../system/checkAdmin.js";

// 📂 Save file
const antiLinkFile = path.join(process.cwd(), "data/antiLinkGroups.json");

// ----------------- Load & Save -----------------
function loadAntiLinkGroups() {
  try {
    if (fs.existsSync(antiLinkFile)) {
      return JSON.parse(fs.readFileSync(antiLinkFile, "utf-8"));
    }
  } catch (err) {
    console.error("❌ Error loading antiLinkGroups.json:", err);
  }
  return {};
}

function saveAntiLinkGroups() {
  try {
    fs.writeFileSync(
      antiLinkFile,
      JSON.stringify(global.antiLinkGroups, null, 2)
    );
  } catch (err) {
    console.error("❌ Error saving antiLinkGroups.json:", err);
  }
}

// ----------------- Global Initialization -----------------
if (!global.antiLinkGroups) global.antiLinkGroups = loadAntiLinkGroups();
if (!global.userWarns) global.userWarns = {};

export default {
  name: "antilink",
  description: "Anti-link with delete, warn or kick options",
  category: "Groupe",
  group: true,
  admin: true,
  botAdmin: true,

  // ==================== COMMAND ====================
  run: async (kaya, m, args) => {
    try {
      const chatId = m.chat;

      if (!m.isGroup) {
        return kaya.sendMessage(
          chatId,
          { text: "❌ This command only works in groups." },
          { quoted: m }
        );
      }

      const action = args[0]?.toLowerCase();
      if (!action || !["on", "off", "delete", "warn", "kick", "status"].includes(action)) {
        return kaya.sendMessage(
          chatId,
          {
            text:
`🔗 *ANTI-LINK COMMAND*

.antilink on      → Enable (WARN mode)
.antilink off     → Disable
.antilink delete  → Delete links automatically
.antilink warn    → 4 warnings = kick
.antilink kick    → Direct kick
.antilink status  → Show current status`
          },
          { quoted: m }
        );
      }

      // 📊 STATUS (allowed to everyone)
      if (action === "status") {
        const data = global.antiLinkGroups[chatId];
        if (!data || !data.enabled) {
          return kaya.sendMessage(
            chatId,
            { text: "❌ Anti-link is disabled in this group." },
            { quoted: m }
          );
        }

        return kaya.sendMessage(
          chatId,
          { text: `✅ Anti-link ENABLED\n📊 Mode: ${data.mode.toUpperCase()}` },
          { quoted: m }
        );
      }

      // 🔐 Admin/Owner check
      const check = await checkAdminOrOwner(kaya, chatId, m.sender);
      if (!check.isAdminOrOwner) {
        return kaya.sendMessage(
          chatId,
          { text: "🚫 Admins or Owner only." },
          { quoted: m }
        );
      }

      // ---------- BOT ADMIN CHECK ----------
      const groupMetadata = await kaya.groupMetadata(chatId).catch(() => null);
      const botIsAdmin = groupMetadata?.participants.some(
        p => p.jid === kaya.user.jid && p.admin
      );

      if (!botIsAdmin && action !== "off") {
        return kaya.sendMessage(
          chatId,
          { text: "❌ Cannot enable/set anti-link: I need to be admin first." },
          { quoted: m }
        );
      }

      // ---------- ACTIONS ----------
      if (action === "on") {
        global.antiLinkGroups[chatId] = { enabled: true, mode: "warn" };
        saveAntiLinkGroups();
        return kaya.sendMessage(
          chatId,
          { text: "✅ Anti-link enabled\n⚠️ WARN mode (4 warnings = kick)" },
          { quoted: m }
        );
      }

      if (action === "off") {
        delete global.antiLinkGroups[chatId];
        delete global.userWarns[chatId];
        saveAntiLinkGroups();
        return kaya.sendMessage(
          chatId,
          { text: "❌ Anti-link disabled and warnings reset." },
          { quoted: m }
        );
      }

      if (["delete", "warn", "kick"].includes(action)) {
        global.antiLinkGroups[chatId] = { enabled: true, mode: action };
        saveAntiLinkGroups();
        return kaya.sendMessage(
          chatId,
          { text: `✅ Anti-link mode set to: ${action.toUpperCase()}` },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("❌ antilink.js error:", err);
      return kaya.sendMessage(
        m.chat,
        { text: "❌ An error occurred while running the anti-link command." },
        { quoted: m }
      );
    }
  },

  // ==================== ANTI-LINK DETECTION ====================
  detect: async (kaya, m) => {
    try {
      if (!m.isGroup || m.key?.fromMe) return;

      const chatId = m.chat;
      if (!global.antiLinkGroups?.[chatId]?.enabled) return;

      const sender = m.sender;
      const mode = global.antiLinkGroups[chatId].mode;

      // ✅ Skip admin/owner
      const check = await checkAdminOrOwner(kaya, chatId, sender);
      if (check.isAdminOrOwner) return;

      const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me)/i;
      if (!linkRegex.test(m.body)) return;

      // 🗑️ Delete message
      await kaya.sendMessage(chatId, { delete: m.key }).catch(() => {});

      // 🚫 MODE DELETE
      if (mode === "delete") {
        return kaya.sendMessage(chatId, {
          text: `🚫 LINKS NOT ALLOWED\n👤 @${sender.split("@")[0]}`,
          mentions: [sender]
        });
      }

      // 🚨 MODE KICK
      if (mode === "kick") {
        await kaya.sendMessage(chatId, {
          text: `🚫 @${sender.split("@")[0]} kicked for sending a link.`,
          mentions: [sender]
        });
        return kaya.groupParticipantsUpdate(chatId, [sender], "remove");
      }

      // ⚠️ MODE WARN
      if (mode === "warn") {
        if (!global.userWarns[chatId]) global.userWarns[chatId] = {};
        global.userWarns[chatId][sender] = (global.userWarns[chatId][sender] || 0) + 1;

        const warns = global.userWarns[chatId][sender];

        await kaya.sendMessage(chatId, {
          text:
`⚠️ ANTI-LINK
👤 @${sender.split("@")[0]}
📊 Warning: ${warns}/4`,
          mentions: [sender]
        });

        if (warns >= 4) {
          delete global.userWarns[chatId][sender];

          await kaya.sendMessage(chatId, {
            text: `🚫 @${sender.split("@")[0]} kicked after 4 warnings.`,
            mentions: [sender]
          });

          await kaya.groupParticipantsUpdate(chatId, [sender], "remove");
        }
      }

    } catch (e) {
      console.error("❌ AntiLink detect error:", e);
    }
  }
};