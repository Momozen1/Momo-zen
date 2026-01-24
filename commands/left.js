// ==================== commands/left.js ====================
import { contextInfo } from "../system/contextInfo.js";

export default {
  name: "left",
  description: "🚪 Le bot quitte le groupe (Sécurité absolue)",
  category: "Groupe",

  run: async (kaya, m) => {
    try {
      // 🔐 Sécurité absolue
      if (!m.fromMe) return;

      // 📛 Groupe uniquement
      if (!m.isGroup) {
        return kaya.sendMessage(
          m.chat,
          { text: "❗ Cette commande s’utilise uniquement dans un groupe.", contextInfo },
          { quoted: m }
        );
      }

      // 🚪 Quitter le groupe (sans message inutile)
      await kaya.groupLeave(m.chat);

    } catch (err) {
      console.error("❌ Erreur commande left :", err);
    }
  }
};