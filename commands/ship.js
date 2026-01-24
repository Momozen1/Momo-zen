// ==================== commands/ship.js ====================
import decodeJid from '../system/decodeJid.js';

export default {
  name: 'ship',
  alias: ['love', 'romance'],
  category: 'Fun',
  description: '💖 Ship deux membres avec un pourcentage d’amour',
  group: true,

  async execute(kaya, m) {
    const chatId = m.chat;

    try {
      if (!m.isGroup) {
        return kaya.sendMessage(
          chatId,
          { text: '❌ Cette commande fonctionne uniquement en groupe.' },
          { quoted: m }
        );
      }

      const metadata = await kaya.groupMetadata(chatId);
      const participants = metadata.participants.map(p => decodeJid(p.id));

      if (participants.length < 2) {
        return kaya.sendMessage(
          chatId,
          { text: '⚠️ Pas assez de membres pour faire un ship.' },
          { quoted: m }
        );
      }

      let user1, user2;

      // 🔹 Mentions
      const mentioned = m.mentionedJid || [];

      if (mentioned.length >= 2) {
        user1 = decodeJid(mentioned[0]);
        user2 = decodeJid(mentioned[1]);
      } else if (mentioned.length === 1 && m.quoted?.sender) {
        user1 = decodeJid(mentioned[0]);
        user2 = decodeJid(m.quoted.sender);
      } else {
        user1 = participants[Math.floor(Math.random() * participants.length)];
        do {
          user2 = participants[Math.floor(Math.random() * participants.length)];
        } while (user2 === user1);
      }

      // ❤️ Pourcentage d’amour
      const percent = Math.floor(Math.random() * 101);

      // 💖 Barre d’amour
      const barLength = 10;
      const filled = Math.round((percent / 100) * barLength);
      const bar = '❤️'.repeat(filled) + '🤍'.repeat(barLength - filled);

      // 📝 Message stylé
      const text = `
💘 *SHIP MATCH* 💘

@${user1.split('@')[0]} ❤️ @${user2.split('@')[0]}

💞 *Compatibilité amoureuse*
${bar}  *${percent}%*

✨ ${percent > 80
        ? 'Couple parfait 💍'
        : percent > 60
        ? 'Très bonne alchimie 😍'
        : percent > 40
        ? 'Ça peut marcher 😉'
        : percent > 20
        ? 'Relation compliquée 😅'
        : 'Mieux vaut rester amis 😬'}

🍻 Félicitations !
`;

      await kaya.sendMessage(
        chatId,
        {
          text,
          mentions: [user1, user2]
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ ship error:', err);
      await kaya.sendMessage(
        chatId,
        { text: '❌ Erreur lors du ship.' },
        { quoted: m }
      );
    }
  }
};