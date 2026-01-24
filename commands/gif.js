// ==================== commands/gif.js ====================
import axios from 'axios';

const GIPHY_API_KEY = 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq';

export default {
  name: 'gif',
  description: '🎬 Search for a GIF via Giphy',
  category: 'Image',
  usage: '.gif <term>',
  ownerOnly: false,

  run: async (sock, m, args) => {
    const chatId = m.chat;
    const query = args.join(' ');

    if (!query) {
      return sock.sendMessage(chatId, { text: '⚠️ Please provide a term to search for a GIF.' }, { quoted: m });
    }

    try {
      const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
        params: {
          api_key: GIPHY_API_KEY,
          q: query,
          limit: 1,
          rating: 'g'
        }
      });

      const gifUrl = response.data.data[0]?.images?.downsized_medium?.mp4 || response.data.data[0]?.images?.downsized_medium?.url;

      if (!gifUrl) {
        return sock.sendMessage(chatId, { text: '❌ No GIF found for this term.' }, { quoted: m });
      }

      // Send the GIF as a video
      await sock.sendMessage(chatId, { video: { url: gifUrl }, caption: `Here is your GIF for "${query}"` }, { quoted: m });

    } catch (err) {
      console.error('❌ GIF Error:', err);
      await sock.sendMessage(chatId, { text: '❌ Unable to fetch the GIF. Please try again later.' }, { quoted: m });
    }
  }
};