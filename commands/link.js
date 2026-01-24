import checkAdminOrOwner from '../system/checkAdmin.js';
import decodeJid from '../system/decodeJid.js';

export default {
  name: 'link',
  alias: ['grouplink', 'invite'],
  category: 'Groupe',
  group: true,
  admin: true,
  botAdmin: true,
  ownerOnly: false,
  usage: '.link',

  run: async (kaya, m, args) => {
    try {
      if (!m.isGroup) return;

      const chatId = decodeJid(m.chat);
      const sender = decodeJid(m.sender);

      // 🔐 Vérification admin / owner (utilisateur)
      const check = await checkAdminOrOwner(kaya, chatId, sender);
      if (!check.isAdminOrOwner) {
        return kaya.sendMessage(
          chatId,
          { text: '🚫 Admin ou Owner uniquement.' },
          { quoted: m }
        );
      }

      // 🔗 Récupération du lien du groupe
      const code = await kaya.groupInviteCode(chatId);
      if (!code) {
        return kaya.sendMessage(
          chatId,
          { text: '❌ Impossible de récupérer le lien du groupe.' },
          { quoted: m }
        );
      }

      const inviteLink = `https://chat.whatsapp.com/${code}`;
      return kaya.sendMessage(
        chatId,
        { text: `🔗 *Link  groupe* :\n${inviteLink}` },
        { quoted: m }
      );

    } catch (err) {
      console.error('[LINK] Error:', err);
      return kaya.sendMessage(
        m.chat,
        { text: '❌ Une erreur est survenue lors de la récupération du lien.' },
        { quoted: m }
      );
    }
  }
};