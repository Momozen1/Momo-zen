// ==================== commands/join.js ====================
export default {
  name: 'join',
  alias: ['joingroup'],
  description: '➕ Faire rejoindre le bot via lien WhatsApp',
  category: 'Owner',
  ownerOnly: true,

  async execute(sock, m, args) {
    try {
      let text = '';

      // 1️⃣ Message principal
      if (m.body) text = m.body;

      // 2️⃣ Message cité
      if (m.quoted?.message) {
        text = m.quoted.message.conversation ||
               m.quoted.message.extendedTextMessage?.text ||
               m.quoted.message.imageMessage?.caption ||
               m.quoted.message.videoMessage?.caption ||
               text;
      }

      // 3️⃣ Argument direct
      if (args[0]) text = args[0];

      if (!text) return;

      // 🔗 Regex lien WhatsApp (souple)
      const match = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/);
      if (!match) return;

      const inviteCode = match[1];

      // ✅ Join groupe
      await sock.groupAcceptInvite(inviteCode);

    } catch (err) {
      console.error('❌ Erreur join:', err);
      return; // silencieux
    }
  }
};