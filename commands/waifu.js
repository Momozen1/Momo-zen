import axios from 'axios';

export default {
  name: 'waifu',
  alias: ['wife', 'animegirl'],
  description: '💖 Envoie une image waifu aléatoire',
  category: 'Anime',
  usage: '',
  async execute(sock, m, args) {
    try {
      const res = await axios.get('https://api.waifu.pics/sfw/waifu', {
        timeout: 30000
      });

      if (!res?.data?.url) {
        return sock.sendMessage(
          m.chat,
          { text: '❌ Impossible de récupérer une waifu.' },
          { quoted: m }
        );
      }

      await sock.sendMessage(
        m.chat,
        {
          image: { url: res.data.url },
          caption: '💖 *Waifu générée pour toi*\n\n> *_KAYA-MD_*'
        },
        { quoted: m }
      );

    } catch (error) {
      console.error('[WAIFU] Error:', error?.message || error);
      await sock.sendMessage(
        m.chat,
        { text: '❌ Erreur lors du chargement de la waifu.' },
        { quoted: m }
      );
    }
  }
};