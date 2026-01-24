// ==================== commands/emojimix.js ====================
import fetch from 'node-fetch';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'emojimix',
  description: '🎴 Mix two emojis to create a sticker',
  category: 'Sticker',
  ownerOnly: false, // Mettre true si c'est réservé à l'owner

  run: async (sock, m, args) => {
    try {
      const text = args.join(' ').trim();
      if (!text) {
        return sock.sendMessage(m.chat, { text: '🎴 Example: .emojimix 😎+🥰', contextInfo }, { quoted: m });
      }

      if (!text.includes('+')) {
        return sock.sendMessage(
          m.chat,
          { text: '✳️ Separate the emoji with a *+* sign\n\n📌 Example: \n*.emojimix* 😎+🥰', contextInfo },
          { quoted: m }
        );
      }

      const [emoji1, emoji2] = text.split('+').map(e => e.trim());

      const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return sock.sendMessage(m.chat, { text: '❌ These emojis cannot be mixed! Try different ones.', contextInfo }, { quoted: m });
      }

      const imageUrl = data.results[0].url;

      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const tempFile = path.join(tmpDir, `temp_${Date.now()}.png`);
      const outputFile = path.join(tmpDir, `sticker_${Date.now()}.webp`);

      const imageResponse = await fetch(imageUrl);
      const buffer = await imageResponse.buffer();
      fs.writeFileSync(tempFile, buffer);

      const ffmpegCommand = `ffmpeg -i "${tempFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" "${outputFile}"`;

      await new Promise((resolve, reject) => {
        exec(ffmpegCommand, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      if (!fs.existsSync(outputFile)) throw new Error('Failed to create sticker file');

      const stickerBuffer = fs.readFileSync(outputFile);
      await sock.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });

      // Cleanup
      fs.unlinkSync(tempFile);
      fs.unlinkSync(outputFile);

    } catch (error) {
      console.error('❌ Emojimix error:', error);
      await sock.sendMessage(
        m.chat,
        { text: '❌ Failed to mix emojis! Make sure you\'re using valid emojis.\n\nExample: .emojimix 😎+🥰', contextInfo },
        { quoted: m }
      );
    }
  }
};