export default {
  name: 'character',
  alias: ['char', 'analyze'],
  category: 'Fun',
  description: 'Analyse les traits de caractère d’un utilisateur de manière amusante',
  usage: '.character @user ou reply à un message',

  run: async (kaya, m, args) => {
    try {
      const chatId = m.chat;

      // ==================== CIBLE ====================
      let target = null;

      // 1️⃣ Mention
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      // 2️⃣ Réponse à un message
      else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }
      // 3️⃣ Numéro écrit
      else if (args[0]) {
        target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      }

      if (!target) {
        return kaya.sendMessage(chatId, {
          text: '❌ Mentionnez quelqu’un ou répondez à son message pour analyser son caractère !'
        }, { quoted: m });
      }

      // 🔹 Récupérer l’image de profil
      let profilePic;
      try {
        profilePic = await kaya.profilePictureUrl(target, 'image');
      } catch {
        profilePic = 'https://i.imgur.com/2wzGhpF.jpeg'; // Image par défaut
      }

      // 🔹 Liste de traits en français
      const traits = [
        "Intelligent","Créatif","Déterminé","Ambitieux","Attentionné",
        "Charismatique","Confiant","Empathique","Énergique","Amical",
        "Généreux","Honnête","Humoristique","Imaginatif","Indépendant",
        "Intuitif","Gentil","Logique","Loyal","Optimiste",
        "Passionné","Patient","Persévérant","Fiable","Ingénieux",
        "Sincère","Réfléchi","Compréhensif","Polyvalent","Sage"
      ];

      // 🔹 Sélection aléatoire de 3 à 5 traits uniques
      const numTraits = Math.floor(Math.random() * 3) + 3; // 3 à 5
      const selectedTraits = [];
      while (selectedTraits.length < numTraits) {
        const randomTrait = traits[Math.floor(Math.random() * traits.length)];
        if (!selectedTraits.includes(randomTrait)) selectedTraits.push(randomTrait);
      }

      // 🔹 Pourcentage aléatoire pour chaque trait (60-100%)
      const traitPercentages = selectedTraits.map(trait => {
        const percentage = Math.floor(Math.random() * 41) + 60; 
        return `${trait} : ${percentage}%`;
      });

      // 🔹 Message final en français
      const analysis = `🔮 *Analyse de caractère* 🔮\n\n` +
        `👤 *Utilisateur:* @${target.split('@')[0]}\n\n` +
        `✨ *Traits clés:*\n${traitPercentages.join('\n')}\n\n` +
        `🎯 *Note globale:* ${Math.floor(Math.random() * 21) + 80}%\n\n` +
        `⚠️ Note : Ceci est une analyse amusante et ne doit pas être prise au sérieux !`;

      // 🔹 Envoi avec l’image de profil
      await kaya.sendMessage(chatId, {
        image: { url: profilePic },
        caption: analysis,
        mentions: [target]
      }, { quoted: m });

    } catch (error) {
      console.error('❌ Erreur commande character:', error);
      await kaya.sendMessage(m.chat, {
        text: '❌ Impossible d’analyser le caractère ! Réessayez plus tard.'
      }, { quoted: m });
    }
  }
};