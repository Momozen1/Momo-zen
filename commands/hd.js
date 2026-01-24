import axios from 'axios';

// Remplace PAR_TON_API_KEY par ta clé Deenio
const DEENIO_API = 'https://api.deenio.com/upscale'; 
const API_KEY = 'PAR_TON_API_KEY';

export default {
  name: 'hd',
  alias: ['enhance','upscale'],
  category: 'Image',
  description: '📸 Enhance an image to HD (AI)',
  usage: '.hd <url> | reply image',

  async run(sock, m, args) {
    try {
      let imageUrl;

      // if URL provided
      if (args.length) {
        const url = args.join(' ');
        try { new URL(url) } catch {
          return sock.sendMessage(m.chat, { text: '❌ Invalid URL. Use: .hd https://image.jpg' }, { quoted: m });
        }
        imageUrl = url;
      } else {
        // handle reply image (code identique pour télécharger l’image)
        imageUrl = await getImageUrlFromMsg(sock, m);
        if (!imageUrl) {
          return sock.sendMessage(m.chat, { text: '📸 Reply to an image or send one with `.hd`' }, { quoted: m });
        }
      }

      // call Deenio upscale API
      const res = await axios.post(DEENIO_API, {
        api_key: API_KEY,
        image_url: imageUrl,
        scale: 2 // 2x upscale (tu peux changer)
      }, { responseType: 'arraybuffer' });

      // check image
      if (!res.headers['content-type']?.includes('image')) {
        throw new Error('Invalid response from API');
      }

      await sock.sendMessage(m.chat, {
        image: res.data,
        caption: `✨ *Successfully enhanced HD image!*`
      }, { quoted: m });

    } catch (err) {
      console.error("[HD ERROR]", err);
      const msg = err.response?.status === 429
        ? '🚦 Too many requests.'
        : '❌ Could not enhance the image to HD.';
      await sock.sendMessage(m.chat, { text: msg }, { quoted: m });
    }
  }
};