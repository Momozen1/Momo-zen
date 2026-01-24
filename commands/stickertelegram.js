import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { writeExif } from '../lib/exif.js';

const delay = time => new Promise(res => setTimeout(res, time));
const BATCH_SIZE = 5;  // Stickers sent in parallel
const BATCH_DELAY = 2000; // ms delay between each batch

export default {
  name: 'tg',
  alias: ['telegram', 'stickertg'],
  description: 'Download a Telegram sticker pack and send it on WhatsApp',
  category: 'Sticker',

  async run(kaya, m, args) {
    try {
      const url = args[0];
      if (!url) {
        return kaya.sendMessage(
          m.chat,
          { text: '⚠️ Please provide the Telegram pack URL.\nEx: .tg https://t.me/addstickers/Porcientoreal' },
          { quoted: m }
        );
      }

      // ✅ Correct regex for mobile & PC
      if (!/^https?:\/\/t\.me\/addstickers\/[A-Za-z0-9_]+$/i.test(url)) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Invalid link! Make sure it is a Telegram sticker pack.' },
          { quoted: m }
        );
      }

      const packName = url.split('/').pop();
      const botToken = '7801479976:AAGuPL0a7kXXBYz6XUSR_ll2SR5V_W6oHl4';

      // Fetch the pack
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getStickerSet?name=${encodeURIComponent(packName)}`);
      if (!res.ok) throw new Error(`Telegram API error: ${res.status}`);
      const packData = await res.json();
      if (!packData.ok || !packData.result) throw new Error('Invalid or private pack');

      const stickers = packData.result.stickers;
      await kaya.sendMessage(
        m.chat,
        { text: `📦 Pack found: ${stickers.length} stickers\n⏳ Downloading...` },
        { quoted: m }
      );

      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      let success = 0;

      for (let i = 0; i < stickers.length; i += BATCH_SIZE) {
        const batch = stickers.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (sticker, index) => {
          try {
            const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${sticker.file_id}`);
            const fileData = await fileRes.json();
            if (!fileData.ok) return;

            const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
            const buffer = await (await fetch(fileUrl)).arrayBuffer();

            const tmpFile = { data: Buffer.from(buffer), mimetype: sticker.is_video ? 'video/mp4' : 'image/png' };
            const exifFile = await writeExif(tmpFile, { packname: packName, author: 'Telegram', categories: [sticker.emoji || '🤖'] });

            const stickerBuffer = fs.readFileSync(exifFile);
            await kaya.sendMessage(m.chat, { sticker: stickerBuffer });
            fs.unlinkSync(exifFile);

            success++;
          } catch (err) {
            console.error(`❌ Sticker error ${i + index}:`, err);
          }
        }));

        // Pause between batches
        await delay(BATCH_DELAY);
      }

      await kaya.sendMessage(
        m.chat,
        { text: `✅ Stickers sent: ${success}/${stickers.length}` },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ tg command error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Unable to download the pack. Check the URL or pack visibility.' },
        { quoted: m }
      );
    }
  }
};