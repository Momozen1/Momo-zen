import checkAdminOrOwner from '../system/checkAdmin.js';

export default {
  name: 'tag',
  description: 'Mention all group members with the written or quoted text',
  category: 'Groupe',
  group: true,
  admin: true,

  run: async (kaya, m, args) => {
    try {
      // 🔹 Check if this is a group
      if (!m.key.remoteJid.endsWith('@g.us')) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ This command only works in groups.' },
          { quoted: m }
        );
      }

      // 🔹 Check admin / owner
      const permissions = await checkAdminOrOwner(kaya, m.chat, m.sender);
      if (!permissions.isAdminOrOwner) {
        return kaya.sendMessage(
          m.chat,
          { text: '⛔ This command is reserved for admins and the owner.' },
          { quoted: m }
        );
      }

      // 🔹 Get quoted text if present (Baileys v7)
      let quotedText = '';
      const ctx = m.message?.extendedTextMessage?.contextInfo;
      if (ctx?.quotedMessage) {
        const qm = ctx.quotedMessage;
        quotedText =
          qm.conversation ||
          qm.extendedTextMessage?.text ||
          qm.imageMessage?.caption ||
          qm.videoMessage?.caption ||
          qm.urlMessage?.canonicalUrl || // <-- Added for links
          '';
      }

      // 🔹 Text to send (if no quoted message, take args or default message)
      const text = quotedText || args.join(' ') || '📢 General mention';

      // 🔹 List of group members
      const metadata = await kaya.groupMetadata(m.chat);
      const members = metadata.participants.map(p => p.id || p.jid).filter(Boolean);

      // 🔹 Send message with mentions
      await kaya.sendMessage(
        m.chat,
        {
          text,
          mentions: members
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ Tag command error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Error occurred while sending the tag.' },
        { quoted: m }
      );
    }
  }
};