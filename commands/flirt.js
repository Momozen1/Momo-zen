import fetch from 'node-fetch';
import googleTranslate from '@vitalets/google-translate-api';

export default {
  name: 'flirt',
  alias: ['drague', 'flirty'],
  category: 'Fun',
  description: 'Envoie un message de drague aléatoire',
  usage: '.flirt @user ou reply à un message',

  run: async (sock, m, args) => {
    const chatId = m.chat;
    let targetUser = null;

    // 🔹 Détecte si c'est un reply ou une mention
    if (m.quoted?.sender) {
      targetUser = m.quoted.sender;
    } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }

    // 🔹 Nom à afficher
    const displayName = targetUser ? '@' + targetUser.split('@')[0] : 'toi';

    try {
      // 🔹 Récupération message flirt depuis l'API
      const apiKey = 'shizo';
      const res = await fetch(`https://shizoapi.onrender.com/api/texts/flirt?apikey=${apiKey}`);
      if (!res.ok) throw new Error('Impossible de récupérer le message.');

      const data = await res.json();
      let flirtMessage = data.result;

      // 🔹 Traduire en français si nécessaire
      try {
        flirtMessage = await googleTranslate(flirtMessage, { to: 'fr' }).then(res => res.text);
      } catch (err) {
        console.warn('⚠️ Traduction échouée, message original utilisé.');
      }

      // 🔹 Pourcentage aléatoire de “flirt”
      const flirtPercent = Math.floor(Math.random() * 41) + 60; // 60-100%

      // 🔹 Message final
      const finalMessage = `💌 ${displayName}, ${flirtMessage}\n❤️ Intensité du flirt : ${flirtPercent}%`;

      // 🔹 Envoi
      await sock.sendMessage(chatId, {
        text: finalMessage,
        mentions: targetUser ? [targetUser] : []
      }, { quoted: m });

    } catch (error) {
      console.error('❌ Erreur commande flirt :', error);
      await sock.sendMessage(chatId, { 
        text: '❌ Impossible de récupérer un message de drague pour le moment. Réessayez plus tard !' 
      }, { quoted: m });
    }
  }
};