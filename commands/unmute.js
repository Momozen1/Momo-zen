// ==================== commands/unlock.js ====================
import checkAdminOrOwner from '../system/checkAdmin.js';

export default {
  name: 'unmute',
  description: '🔓 Unlock the group silently',
  category: 'Groupe',
  group: true,
  admin: true,
  botAdmin: true,

  run: async (kaya, m) => {
    try {
      // 🔹 Check if user is admin or owner
      const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
      if (!permissions.isAdminOrOwner) return;

      // 🔓 Unlock group (everyone can send messages)
      await kaya.groupSettingUpdate(m.chat, 'not_announcement');

      // ✅ SILENT MODE → NO MESSAGE SENT

    } catch (err) {
      console.error('❌ unlock.js error:', err);

      // ❌ Only send message if there is an error
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Failed to unlock the group. Make sure I am admin.' },
        { quoted: m }
      );
    }
  }
};