import axios from 'axios';

export default {
  name: 'fact',
  alias: ['fait', 'info'],
  category: 'Fun',
  description: '💡 Envoie un fait aléatoire amusant ou intéressant en français',
  usage: '.fact',

  run: async (sock, m, args) => {
    const chatId = m.chat;
    try {
      // 🔹 Récupérer un fait aléatoire depuis l’API (langue française)
      const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=fr');
      const fact = response.data.text;

      // 🔹 Envoyer le fait dans le chat
      await sock.sendMessage(chatId, { 
        text: `💡 Fait aléatoire :\n\n${fact}` 
      }, { quoted: m });

    } catch (error) {
      console.error('❌ Erreur lors de la récupération du fait :', error);
      await sock.sendMessage(chatId, { 
        text: '❌ Désolé, je n’ai pas pu récupérer de fait pour le moment. Réessayez plus tard !' 
      }, { quoted: m });
    }
  }
};