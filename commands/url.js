import axios from 'axios';
import FormData from 'form-data';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Readable } from 'stream';
import { BOT_NAME } from '../system/botAssets.js';

export default {
  name: 'url',
  alias: ['catbox', 'upload', 'link'],
  description: '🔗 Generates a Catbox link from an image',
  category: 'Image',
  usage: '<reply to an image>',
  
  async execute(sock, m, args) {
    try {
      // Check for quoted message
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const isQuotedImage = quoted?.imageMessage;
      const isImage = m.message?.imageMessage;

      if (!isQuotedImage && !isImage) {
        return sock.sendMessage(m.chat, {    
          text: `📸 *${BOT_NAME}* - Usage: Reply to an image to generate a Catbox link\n\nExamples:\n• .url (reply to an image)\n• .catbox (alias)`    
        }, { quoted: m });
      }

      // Indicate the bot is processing
      await sock.sendPresenceUpdate('composing', m.chat);

      // Convert stream to Buffer
      const streamToBuffer = async (stream) => {
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
      };

      // Download the image
      let buffer;
      let imageMessage;
      
      if (isQuotedImage) {
        imageMessage = quoted.imageMessage;
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        buffer = await streamToBuffer(stream);
      } else {
        imageMessage = m.message.imageMessage;
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        buffer = await streamToBuffer(stream);
      }

      if (!buffer || buffer.length < 100) {
        return sock.sendMessage(m.chat, {
          text: `❌ *${BOT_NAME}* - Unable to read this image (file too small or corrupted)`
        }, { quoted: m });
      }

      // Determine extension from mimetype
      const mimeType = imageMessage?.mimetype || 'image/jpeg';
      let extension = 'jpg';
      if (mimeType.includes('png')) extension = 'png';
      if (mimeType.includes('webp')) extension = 'webp';
      if (mimeType.includes('gif')) extension = 'gif';

      // Prepare FormData
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', Readable.from(buffer), `image.${extension}`);

      // Upload to Catbox
      const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
        timeout: 30000
      });

      const url = response.data.trim();

      // Send result
      const message = `
╭────「 ${BOT_NAME} 」────⬣
│ 📤 Link successfully generated!
│ 🔗 Catbox Link:
│ ${url}
╰──────────────────⬣`.trim();

      await sock.sendMessage(m.chat, { text: message }, { quoted: m });

    } catch (error) {
      console.error('❌ URL command error:', error);

      let errorMessage = `❌ *${BOT_NAME}* - Error generating the link.`;
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        errorMessage = `❌ *${BOT_NAME}* - Catbox is unreachable or too slow. Try again later.`;
      } else if (error.response?.status === 413) {
        errorMessage = `❌ *${BOT_NAME}* - Image is too large (>20MB).`;
      } else if (error.message.includes('unsupported image')) {
        errorMessage = `❌ *${BOT_NAME}* - Image format not supported by Catbox.`;
      }

      sock.sendMessage(m.chat, { text: errorMessage }, { quoted: m });
    }
  }
};