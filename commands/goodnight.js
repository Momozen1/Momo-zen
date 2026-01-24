export default {
  name: 'goodnight',
  alias: ['gn', 'lovenight', 'bonne nuit'],
  category: 'Fun',
  description: '💤 Envoie un message mignon de bonne nuit à quelqu’un',
  usage: '.goodnight @user ou .goodnight <texte>',

  run: async (sock, m, args) => {
    const chatId = m.chat;
    let targetUser;

    // 🔹 Priorité : mention ou reply
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid?.length) {
      targetUser = ctx.mentionedJid[0];
    } else if (ctx?.participant) {
      targetUser = ctx.participant;
    } 
    // 🔹 Sinon, si un texte ou numéro est passé en argument
    else if (args[0]) {
      const num = args[0].replace(/\D/g, '');
      targetUser = `${num}@s.whatsapp.net`;
    } 
    // 🔹 Par défaut, envoyer au sender lui-même
    else {
      targetUser = m.sender;
    }

    try {
      let goodnightMessage = '';

      // 🔹 Si l’utilisateur a fourni un texte
      if (args.length) {
        goodnightMessage = args.join(' ');
      } 
      // 🔹 Sinon, message par défaut
      else {
        goodnightMessage = 'Bonne nuit !';
      }

      // 🔹 Beautify avec plusieurs têtes / emojis
      goodnightMessage = beautifyGoodnight(goodnightMessage);

      // 🔹 Envoi du message
      await sock.sendMessage(chatId, {
        text: `💤 Bonne nuit @${targetUser.split('@')[0]} 🌙\n\n${goodnightMessage}`,
        mentions: [targetUser],
        quoted: m
      });

    } catch (error) {
      console.error('❌ Erreur commande Goodnight :', error);
      await sock.sendMessage(chatId, {
        text: '❌ Impossible d’envoyer le message de bonne nuit. Réessayez plus tard !',
        quoted: m
      });
    }
  }
};

// 🔹 Fonction pour styliser le message avec plusieurs têtes
function beautifyGoodnight(text) {
  const emojis = ['🌙', '💤', '💫', '✨', '🌟', '🛌', '😴', '🌌', '🌠'];
  // Choisir 3 emojis aléatoires
  const selected = [];
  while (selected.length < 3) {
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    if (!selected.includes(emoji)) selected.push(emoji);
  }

  return `✨ ${text}

${selected.join(' ')} Que tes rêves soient doux,
${selected.join(' ')} Que la nuit t’apporte la paix,
${selected.join(' ')} Et que demain soit encore meilleur.`;
}