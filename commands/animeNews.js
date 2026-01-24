import axios from 'axios';

export default {
  name: 'animenews',
  alias: ['newsanime'],
  description: '📰 Donne les dernières actualités d’un anime aléatoire',
  category: 'Anime',
  ownerOnly: false,

  async execute(sock, m) {
    try {
      // On prend d'abord un anime populaire
      const topRes = await axios.get('https://api.jikan.moe/v4/top/anime?page=1');
      const topData = topRes.data?.data;

      if (!topData || topData.length === 0) {
        throw new Error('Pas de top anime');
      }

      const randomAnime = topData[Math.floor(Math.random() * topData.length)];
      const animeId = randomAnime.mal_id;

      const newsRes = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}/news`);
      const newsData = newsRes.data?.data;

      if (!newsData || newsData.length === 0) {
        return sock.sendMessage(m.chat, {
          text: `❌ Aucune actualité trouvée pour l’anime *${randomAnime.title}*.`,
        }, { quoted: m });
      }

      const newsList = newsData.slice(0, 5).map((item, index) => {
        const title = item.title || 'Sans titre';
        const link = item.url || '';
        const date = item.date
          ? new Date(item.date).toLocaleDateString('fr-FR')
          : 'Inconnue';
        return `📰 ${index + 1}. *${title}*\n📅 ${date}\n🔗 ${link}`;
      }).join('\n\n');

      await sock.sendMessage(
        m.chat,
        { text: `✨ *Actualités autour de ${randomAnime.title}* ✨\n\n${newsList}` },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ animeNews error:', err);
      await sock.sendMessage(
        m.chat,
        { text: '❌ Impossible de récupérer les actualités. Essaie encore plus tard.' },
        { quoted: m }
      );
    }
  }
};