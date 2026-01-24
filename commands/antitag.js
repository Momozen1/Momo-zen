// ==================== commands/antitag.js ====================
import { setAntitag, getAntitag, removeAntitag } from "../lib/antitag.js";
import checkAdminOrOwner from "../system/checkAdmin.js";

export default {
  name: "antitag",
  alias: ["anti-tag"], // "tagall" supprimé
  description: "🚫 Configure the anti-tag system",
  category: "Groupe",
  group: true,
  admin: true,
  botAdmin: true,

  // ==================== COMMAND ====================
  run: async (kaya, m, args) => {
    try {
      const chatId = m.chat;

      if (!m.isGroup) {
        return kaya.sendMessage(chatId, { text: "❌ This command only works in groups." }, { quoted: m });
      }

      const action = args[0]?.toLowerCase();

      // 📖 Help menu
      if (!action) {
        return kaya.sendMessage(
          chatId,
          {
            text: `🚫 *ANTITAG SYSTEM*

.antitag on
→ Enable antitag (default action: DELETE)

.antitag off
→ Disable antitag

.antitag set delete
→ Delete messages containing tagall

.antitag set kick
→ Kick user on tagall

.antitag get
→ Show antitag status`
          },
          { quoted: m }
        );
      }

      // 📊 GET STATUS
      if (action === "get") {
        const data = await getAntitag(chatId);
        return kaya.sendMessage(
          chatId,
          {
            text:
`📊 *ANTITAG STATUS*
• State  : ${data?.enabled ? "ON ✅" : "OFF ❌"}
• Action : ${data?.action || "—"}`
          },
          { quoted: m }
        );
      }

      // 🔐 Admin / Owner check
      const check = await checkAdminOrOwner(kaya, chatId, m.sender);
      if (!check.isAdminOrOwner) {
        return kaya.sendMessage(chatId, { text: "🚫 Only admins or owner can use this command." }, { quoted: m });
      }

      // ⚙️ ACTIONS
      switch (action) {
        case "on":
          await setAntitag(chatId, true, "delete");
          return kaya.sendMessage(chatId, { text: "✅ Antitag enabled (action: DELETE)." }, { quoted: m });

        case "off":
          await removeAntitag(chatId);
          return kaya.sendMessage(chatId, { text: "❌ Antitag disabled." }, { quoted: m });

        case "set": {
          const mode = args[1];
          if (!["delete", "kick"].includes(mode)) {
            return kaya.sendMessage(chatId, { text: "⚠️ Usage: .antitag set delete | kick" }, { quoted: m });
          }

          await setAntitag(chatId, true, mode);
          return kaya.sendMessage(chatId, { text: `⚙️ Antitag action set to: ${mode.toUpperCase()}` }, { quoted: m });
        }

        default:
          return kaya.sendMessage(chatId, { text: "❓ Unknown option. Type .antitag" }, { quoted: m });
      }

    } catch (err) {
      console.error("❌ ANTITAG COMMAND ERROR:", err);
      await kaya.sendMessage(m.chat, { text: "❌ Error while processing antitag command." }, { quoted: m });
    }
  }
};