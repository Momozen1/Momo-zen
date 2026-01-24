// ==================== commands/remini.js ====================
import axios from 'axios';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { uploadImage } from '../lib/uploadImage.js';

async function getQuotedOrOwnImageUrl(sock, message) {
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (quoted?.imageMessage) {
    const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return uploadImage(Buffer.concat(chunks));
  }

  if (message.message?.imageMessage) {
    const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return uploadImage(Buffer.concat(chunks));
  }

  return null;
}

function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}

export default {
  name: 'remini',
  alias: ['enhance', 'hd'],
  category: 'Image',
  description: '✨ Améliore la qualité d’une image (AI)',
  usage: '.remini <url> | reply image',

  async run(sock, m, args) {
    try {
      let imageUrl;

      // 🌐 URL fournie
      if (args.length) {
        const url = args.join(' ');
        if (!isValidUrl(url)) {
          return sock.sendMessage(m.chat,
            { text: '❌ URL invalide.\nEx: `.remini https://image.jpg`' },
            { quoted: m }
          );
        }
        imageUrl = url;
      } 
      // 🖼️ Image envoyée / reply
      else {
        imageUrl = await getQuotedOrOwnImageUrl(sock, m);
        if (!imageUrl) {
          return sock.sendMessage(m.chat,
            { text: '📸 Reply à une image ou envoie-en une avec `.remini`' },
            { quoted: m }
          );
        }
      }

      // ✅ API REMINI / UPSCALE STABLE
      const api = `https://api.axyz.my.id/api/upscale?url=${encodeURIComponent(imageUrl)}`;
      const res = await axios.get(api, {
        responseType: 'arraybuffer',
        timeout: 60000
      });

      // sécurité : vérifier que c’est bien une image
      if (!res.headers['content-type']?.includes('image')) {
        throw new Error('API n’a pas renvoyé une image');
      }

      await sock.sendMessage(m.chat, {
        image: res.data,
        caption: '✨ *Image améliorée avec succès !*\n\n𝗞𝗔𝗬𝗔-𝗠𝗗'
      }, { quoted: m });

    } catch (err) {
      console.error('[REMINI ERROR]', err);

      let msg = '❌ Impossible d’améliorer l’image.';
      if (err.code === 'ECONNABORTED') msg = '⏰ Timeout. Réessaie.';
      if (err.response?.status === 429) msg = '🚦 Trop de requêtes.';
      if (err.message.includes('image')) msg = '❌ Image invalide.';

      await sock.sendMessage(m.chat, { text: msg }, { quoted: m });
    }
  }
};