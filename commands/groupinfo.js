import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'groupinfo',
  alias: ['infogroup', 'ginfo'],
  description: 'Displays group information',
  category: 'Groupe',

  async run(kaya, m) {
    try {
      // ❌ Group only
      if (!m.isGroup) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ This command only works in a group.', contextInfo },
          { quoted: m }
        );
      }

      // 📋 Group metadata
      const groupMetadata = await kaya.groupMetadata(m.chat);
      const participants = groupMetadata.participants;

      // 👑 Admins
      const admins = participants.filter(p => p.admin);
      const adminList = admins
        .map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`)
        .join('\n');

      // 👤 Owner
      const owner =
        groupMetadata.owner ||
        admins.find(v => v.admin === 'superadmin')?.id ||
        m.chat.split('-')[0] + '@s.whatsapp.net';

      // 🖼️ Group picture
      let pp;
      try {
        pp = await kaya.profilePictureUrl(m.chat, 'image');
      } catch {
        pp = 'https://i.imgur.com/2wzGhpF.jpeg';
      }

      // 📝 Text
      const text = `
┌──「 👑 *GROUP INFO* 👑 」
│
├ 🆔 *ID* :
│ • ${groupMetadata.id}
│
├ 🔖 *Name* :
│ • ${groupMetadata.subject}
│
├ 👥 *Members* :
│ • ${participants.length}
│
├ 🤿 *Owner* :
│ • @${owner.split('@')[0]}
│
├ 🕵🏻‍♂️ *Admins* :
${adminList || '• None'}
│
├ 📌 *Description* :
│ • ${groupMetadata.desc || 'No description'}
└───────────────
`.trim();

      // 📤 Send
      await kaya.sendMessage(
        m.chat,
        {
          image: { url: pp },
          caption: text,
          mentions: [...admins.map(v => v.id), owner],
          contextInfo
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ groupinfo error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Unable to fetch group information.', contextInfo },
        { quoted: m }
      );
    }
  }
};