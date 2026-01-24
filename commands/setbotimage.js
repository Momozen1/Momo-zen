import axios from 'axios';
import { setBotImage } from '../system/botAssets.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'setbotimage',
  description: 'Change the bot image via a link',
  category: 'Owner',
  ownerOnly: true, // ✅ handled by the handler

  run: async (sock, m, args) => {
    try {
      // Check if a link is provided
      const url = args[0];
      if (!url || !url.startsWith('http')) {
        return sock.sendMessage(
          m.chat,
          { text: '❌ Please provide a valid link to change the bot image.\nExample: `.setbotimage https://files.catbox.moe/s42m2j.jpg`', contextInfo },
          { quoted: m }
        );
      }

      // Download the image from the link
      const res = await axios.get(url, { responseType: 'arraybuffer' });

      // Check if the file is actually an image
      const contentType = res.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        return sock.sendMessage(
          m.chat,
          { text: '❌ The provided link does not contain a valid image.', contextInfo },
          { quoted: m }
        );
      }

      const buffer = Buffer.from(res.data);

      // Save the image
      setBotImage(buffer);

      await sock.sendMessage(
        m.chat,
        { text: '✅ Bot image updated successfully!', contextInfo },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ setbotimage error:', err);
      await sock.sendMessage(
        m.chat,
        { text: '❌ Unable to change the bot image. Check the link or try again.', contextInfo },
        { quoted: m }
      );
    }
  }
};