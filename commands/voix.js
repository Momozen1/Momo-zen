import { getAudioUrl } from '../lib/tts.js';
import { BOT_NAME } from '../system/botAssets.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

export default {
  name: 'voice',
  description: '🎤 Converts text into a voice message in multiple languages',
  category: 'General',
  ownerOnly: false,

  run: async (kaya, m, args) => {
    try {
      if (!args.length) {
        return kaya.sendMessage(
          m.chat,
          {
            text: `❌ *${BOT_NAME}* - Please provide text to convert into voice.\n\nUsage:\n.voice <lang> [--slow] <text>\nExample:\n.voice en Hello everyone!\n.voice fr --slow Bonjour tout le monde!`
          },
          { quoted: m }
        );
      }

      // --- Analyse des arguments ---
      let lang = args[0].toLowerCase();
      const supportedLangs = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
      let slow = false;
      let textStartIndex = 1;

      if (!supportedLangs.includes(lang)) {
        // Pas de langue valide : utiliser par défaut 'fr'
        lang = 'fr';
        textStartIndex = 0;
      }

      // Vérifier option slow
      if (args[textStartIndex] === '--slow' || args[textStartIndex] === '-s') {
        slow = true;
        textStartIndex++;
      }

      const text = args.slice(textStartIndex).join(' ');
      if (!text) {
        return kaya.sendMessage(
          m.chat,
          { text: `❌ *${BOT_NAME}* - Please provide text after the language code.` },
          { quoted: m }
        );
      }

      // --- Découpage du texte si trop long ---
      const maxLen = 200; // limite Google TTS
      const segments = [];
      for (let i = 0; i < text.length; i += maxLen) {
        segments.push(text.slice(i, i + maxLen));
      }

      // --- Générer chaque segment audio ---
      const buffers = [];
      for (const segment of segments) {
        const url = getAudioUrl(segment, { lang, slow });
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        buffers.push(Buffer.from(response.data));
      }

      // Combiner tous les segments
      const finalBuffer = Buffer.concat(buffers);

      // Enregistrer temporairement
      const tempFile = path.join(os.tmpdir(), `voice_${Date.now()}.mp3`);
      fs.writeFileSync(tempFile, finalBuffer);

      // Envoyer le voice note
      await kaya.sendMessage(
        m.chat,
        {
          audio: fs.createReadStream(tempFile),
          mimetype: 'audio/mpeg',
          ptt: true
        },
        { quoted: m }
      );

      // Supprimer le fichier temporaire
      fs.unlinkSync(tempFile);

    } catch (err) {
      console.error('❌ voice command error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: `❌ *${BOT_NAME}* - An error occurred while generating the voice message.` },
        { quoted: m }
      );
    }
  }
};