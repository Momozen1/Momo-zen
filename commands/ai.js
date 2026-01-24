import fetch from 'node-fetch';

export default {
  name: 'ai',
  alias: ['gpt', 'chat'],
  category: 'AI',
  description: 'Parler avec une intelligence artificielle',
  usage: '.ai <question> | reply à un message',

  run: async (kaya, m, args) => {
    try {
      let prompt = '';

      // ================== RÉCUP TEXTE (Baileys v7 RC6) ==================
      if (m.quoted?.message) {
        const msg = m.quoted.message;
        prompt =
          msg.extendedTextMessage?.text || // reply texte
          msg.imageMessage?.caption ||     // caption image
          msg.videoMessage?.caption ||     // caption vidéo
          msg.documentMessage?.caption ||  // caption document
          '';
      } else {
        prompt = args.join(' ');
      }

      if (!prompt.trim()) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Pose une question ou reply à un message.\n\nExemple:\n.ai Explique JavaScript' },
          { quoted: m }
        );
      }

      // ⏳ Message d’attente
      await kaya.sendMessage(
        m.chat,
        { text: '🤖 Réflexion en cours...' },
        { quoted: m }
      );

      // ================== APPEL API ==================
      const res = await fetch(
        `https://shizoapi.onrender.com/api/ai/chat?query=${encodeURIComponent(prompt)}`
      );

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const reply = data?.result || data?.response || '❌ Aucune réponse trouvée.';

      // ================== ENVOI ==================
      await kaya.sendMessage(
        m.chat,
        { text: reply },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ AI command error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Erreur AI. L’API peut être indisponible ou votre message vide.' },
        { quoted: m }
      );
    }
  }
};