import checkAdminOrOwner from "../system/checkAdmin.js";

export default {
  name: "del",
  alias: ["delete", "rm"],
  description: "Delete a message in a group",
  category: "Groupe",
  group: true,
  admin: true,
  ownerOnly: false,
  usage: ".del <reply>",

  run: async (kaya, m) => {
    try {
      const chatId = m.chat;

      if (!m.isGroup) {
        return kaya.sendMessage(chatId, { text: "❌ This command works only in groups." }, { quoted: m });
      }

      // 🔐 Check admin / owner
      const check = await checkAdminOrOwner(kaya, chatId, m.sender);
      if (!check.isAdmin && !check.isOwner) {
        return kaya.sendMessage(chatId, { text: "🚫 Admins or Owner only." }, { quoted: m });
      }

      // 🗑️ Si message répondu
      if (m.quoted) {
        try {
          await kaya.sendMessage(chatId, { delete: m.quoted.key });
          return kaya.sendMessage(chatId, { text: "✅ Message deleted successfully." }, { quoted: m });
        } catch (err) {
          console.error("[DEL] Reply Error:", err);
          return kaya.sendMessage(chatId, { text: "❌ Could not delete this message." }, { quoted: m });
        }
      }

      // ⚠️ Si aucun reply
      return kaya.sendMessage(chatId, { text: "⚠️ Reply to the message you want to delete." }, { quoted: m });

    } catch (err) {
      console.error("[DEL] Error:", err);
      return kaya.sendMessage(chatId, { text: "❌ An error occurred while deleting the message." }, { quoted: m });
    }
  }
};