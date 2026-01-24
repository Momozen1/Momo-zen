// ==================== commands/block.js ====================
export default {
  name: "block",
  category: "Owner",

  run: async (kaya, m) => {
    try {
      // 🔐 Owner uniquement (en MP)
      if (!m.fromMe || m.isGroup) return;

      // 🔒 Blocage direct, silencieux
      await kaya.updateBlockStatus(m.chat, "block");

    } catch {
      // ❌ AUCUNE sortie, AUCUN log
    }
  }
};