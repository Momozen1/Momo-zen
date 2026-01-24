import axios from 'axios';

// Sources SFW (soft anime / waifu)
const SOURCES = [
  'https://api.waifu.pics/sfw/waifu',
  'https://api.waifu.pics/sfw/neko',
  'https://api.waifu.pics/sfw/megumin',
  'https://nekos.best/api/v2/waifu',
  'https://nekos.best/api/v2/neko'
];

// Cooldown par utilisateur / groupe
const cooldown = new Map();

async function fetchImage() {
  for (const url of SOURCES) {
    try {
      const res = await axios.get(url, { timeout: 15000 });
      if (res.data?.url) return res.data.url;
      if (res.data?.results?.[0]?.url) return res.data.results[0].url;
    } catch {
      continue;
    }
  }
  return null;
}

export default {
  name: 'nsfw',
  description: '🎨 Anime / fanart soft (SFW) utilisable en groupe et privé',
  category: 'Anime',
  ownerOnly: false,

  async execute(sock, m) {
    try {
      const userId = m.sender;
      const chatId = m.chat;
      const key = `${chatId}-${userId}`;

      // 🔹 Cooldown 10s
      const last = cooldown.get(key);
      if (last && Date.now() - last < 10000) return;

      cooldown.set(key, Date.now());
      setTimeout(() => cooldown.delete(key), 10000);

      const imageUrl = await fetchImage();
      if (!imageUrl) {
        return sock.sendMessage(
          chatId,
          { text: '❌ Impossible de charger une image pour le moment.' },
          { quoted: m }
        );
      }

      await sock.sendMessage(
        chatId,
        {
          image: { url: imageUrl },
          caption: `🎨 *Anime Art – Soft*\n\nby KAYA‑MD`
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ NSFW error:', err);
    }
  }
};