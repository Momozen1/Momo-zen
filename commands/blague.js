import axios from 'axios';

export default {
  name: 'blague',
  alias: ['blague', 'dadjoke'],
  category: 'Fun',
  description: 'Envoie une blague aléatoire de style "dad joke" en français',
  usage: '.blague',

  run: async (sock, m, args) => {
    const chatId = m.chat;

    try {
      // Réaction emoji pour indiquer le chargement
      await sock.sendMessage(chatId, { react: { text: '😂', key: m.key } });

      // Essayer de récupérer la blague jusqu'à 3 fois
      let joke = null;
      for (let i = 0; i < 3 && !joke; i++) {
        try {
          const res = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' },
            timeout: 5000
          });
          joke = res.data?.joke || null;
        } catch (e) {
          console.warn(`Tentative ${i + 1} échouée:`, e.message);
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      if (!joke) throw new Error('Impossible de récupérer une blague.');

      // 🔹 Traduction simple en français
      const jokeFr = await translateToFrench(joke);

      // Envoi de la blague
      await sock.sendMessage(chatId, {
        text: `🎉 *Voici une blague pour toi :*\n\n${jokeFr}`,
        mentions: [m.sender],
        quoted: m
      });

    } catch (error) {
      console.error('❌ Erreur dans la commande blague:', error.message || error);
      await sock.sendMessage(chatId, {
        text: '❌ Oups ! Je n’ai pas pu récupérer de blague pour le moment. Réessaie plus tard 😅',
        quoted: m
      });
    }
  }
};

// 🔹 Fonction de traduction gratuite
async function translateToFrench(text) {
  try {
    const res = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text,
        langpair: 'en|fr'
      },
      timeout: 5000
    });
    return res.data.responseData.translatedText || text;
  } catch {
    return text; // fallback : renvoyer l'original si la traduction échoue
  }
}