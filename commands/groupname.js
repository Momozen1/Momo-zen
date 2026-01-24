// ================= commands/groupName.js =================
import checkAdminOrOwner from '../system/checkAdmin.js';
import decodeJid from '../system/decodeJid.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'groupname',
  alias: ['setgroupname'],
  description: 'Change the group name',
  category: 'Groupe',
  group: true,
  admin: true,
  botAdmin: true, // ✅ handled by handler
  ownerOnly: false,
  usage: '.groupname NewName',

  run: async (kaya, m, args) => {
    try {
      if (!m.isGroup) return;

      const chatId = decodeJid(m.chat);
      const sender = decodeJid(m.sender);

      if (!args || args.length === 0) {
        return kaya.sendMessage(
          chatId,
          { text: '❌ Usage: `.groupname NewName`', contextInfo },
          { quoted: m }
        );
      }

      const newName = args.join(' ').trim();

      // 🔐 ADMIN / OWNER check
      const check = await checkAdminOrOwner(kaya, chatId, sender);
      if (!check.isAdminOrOwner) {
        return kaya.sendMessage(
          chatId,
          { text: '🚫 Admin or Owner only.', contextInfo },
          { quoted: m }
        );
      }

      // ✏️ Change the group name
      await kaya.groupUpdateSubject(chatId, newName);

      return kaya.sendMessage(
        chatId,
        { text: `✅ Group name changed to: *${newName}*`, contextInfo },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ groupname error:', err);
      return kaya.sendMessage(
        m.chat,
        { text: '❌ Unable to change the group name.', contextInfo },
        { quoted: m }
      );
    }
  }
};