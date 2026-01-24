// ==================== commands/compliment.js ====================
const compliments = [
    "Tu es incroyable tel que tu es !",
    "Tu as un sens de l'humour génial !",
    "Tu es incroyablement attentionné et gentil.",
    "Tu es plus puissant que tu ne le crois.",
    "Tu illumines la pièce !",
    "Tu es un vrai ami.",
    "Tu m'inspires !",
    "Tu es intelligent comme le roi noir Léonidas.",
    "Tu as un cœur en or.",
    "Tu fais une différence dans le monde.",
    "Ta positivité est contagieuse !",
    "Tu as une éthique de travail incroyable.",
    "Tu fais ressortir le meilleur chez les autres.",
    "Ton sourire illumine la journée de tout le monde.",
    "Tu es doué dans tout ce que tu fais.",
    "Ta gentillesse rend le monde meilleur.",
    "Tu as une perspective unique et merveilleuse.",
    "Ton enthousiasme est vraiment inspirant !",
    "Tu es capable d’accomplir de grandes choses.",
    "Tu sais toujours comment rendre quelqu’un spécial.",
    "Ta confiance est admirable.",
    "Tu as une belle âme.",
    "Ta générosité n’a pas de limites.",
    "Tu as un œil exceptionnel pour les détails.",
    "Ta passion est vraiment motivante !",
    "Tu es un(e) auditeur(trice) exceptionnel(le).",
    "Tu es plus fort(e) que tu ne le penses !",
    "Ton rire est contagieux.",
    "Tu as un don naturel pour valoriser les autres.",
    "Tu rends le monde meilleur simplement en étant là."
];

export default {
  name: 'compliment',
  alias: ['complimenter', 'kudos', 'bravo'],
  category: 'Fun',
  description: 'Fait un compliment à un utilisateur mentionné ou en réponse à son message',
  usage: '.compliment @user ou reply à un message',

  run: async (sock, m, args) => {
    const chatId = m.chat;
    let userToCompliment;

    // 🔹 Vérifier les mentions
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      userToCompliment = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // 🔹 Vérifier si c’est une réponse
    else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
      userToCompliment = m.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToCompliment) {
      return sock.sendMessage(chatId, {
        text: '❌ Mentionnez quelqu’un ou répondez à son message pour lui faire un compliment !'
      });
    }

    try {
      // 🔹 Sélection aléatoire d’un compliment
      const compliment = compliments[Math.floor(Math.random() * compliments.length)];

      // 🔹 Petite pause pour éviter le spam
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 🔹 Envoi du compliment
      await sock.sendMessage(chatId, {
        text: `✨ Hey @${userToCompliment.split('@')[0]}, ${compliment}`,
        mentions: [userToCompliment]
      });

    } catch (error) {
      console.error('❌ Erreur dans la commande compliment :', error);
      await sock.sendMessage(chatId, {
        text: '❌ Une erreur est survenue lors de l’envoi du compliment.'
      });
    }
  }
};