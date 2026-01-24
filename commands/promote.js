// ==================== commands/promote.js ====================
import checkAdminOrOwner from '../system/checkAdmin.js';

export default {
  name: 'promote',
  description: '👑 Promouvoir un membre du groupe (silencieux)',
  category: 'Groupe',
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, args) => {
    try {
      if (!m.isGroup) return;

      // 🔹 Vérification admin / owner
      const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
      if (!permissions.isAdminOrOwner) {
        return kaya.sendMessage(
          m.chat,
          { text: "🚫 Seuls les Admins ou le Propriétaire peuvent utiliser `.promote`." }
        );
      }

      // ==================== CIBLE ====================
      let target = null;

      // 1️⃣ Mention
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      // 2️⃣ Réponse à un message
      else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }
      // 3️⃣ Numéro écrit
      else if (args[0]) {
        target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      }

      if (!target) return kaya.sendMessage(m.chat, { text: "⚠️ Cible introuvable pour promotion." });

      // ✅ Promotion silencieuse
      await kaya.groupParticipantsUpdate(m.chat, [target], 'promote');

      // ❌ Aucun message envoyé au groupe
      return;

    } catch (err) {
      console.error('❌ Erreur promote:', err);
      return kaya.sendMessage(m.chat, { text: '❌ Impossible de promouvoir ce membre.' });
    }
  }
};