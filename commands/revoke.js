// ==================== commands/revoke.js ====================
import checkAdminOrOwner from '../system/checkAdmin.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'revoke',
  alias: ['demote', 'unadmin'],
  description: '🔻 Demotes an admin in the group (silent)',
  category: 'Groupe',
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m, args) => {
    try {
      if (!m.isGroup) return;

      // 🔹 Check if sender is admin / owner
      const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
      if (!permissions.isAdminOrOwner) {
        return kaya.sendMessage(
          m.chat,
          { text: "🚫 Only group Admins or the Owner can use `.revoke`.", contextInfo },
          { quoted: m }
        );
      }

      // ==================== TARGET ====================
      let target = null;

      // 1️⃣ Mentioned user
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      // 2️⃣ Reply to a message
      else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }
      // 3️⃣ User by number
      else if (args[0]) {
        target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      }

      if (!target) {
        return kaya.sendMessage(
          m.chat,
          { text: "⚠️ Target not found for demotion.", contextInfo },
          { quoted: m }
        );
      }

      // 🚫 Security: Do not demote the group owner
      const ownerJid = m.chat.split('@')[0] + '@s.whatsapp.net';
      if (permissions.isOwner && target === ownerJid) return;

      // ✅ Silent demotion
      await kaya.groupParticipantsUpdate(m.chat, [target], 'demote');

      // ❌ No message sent to the group
      return;

    } catch (err) {
      console.error('❌ revoke error:', err);
      return kaya.sendMessage(
        m.chat,
        { text: '❌ Unable to demote this member.', contextInfo },
        { quoted: m }
      );
    }
  }
};