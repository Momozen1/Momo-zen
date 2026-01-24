// ==================== commands/attp.js ====================
import fs from 'fs';
import { spawn } from 'child_process';
import path from 'path';
import { writeExif } from '../lib/exif.js'; // your ESModule helper

export default {
  name: 'attp',
  alias: ['stickertext', 'textsticker'],
  category: 'sticker',
  description: 'Creates an animated sticker from text',
  usage: '.attp <text>',

  run: async (sock, m, args) => {
    const chatId = m.chat;
    const text = args.join(' ').trim();

    if (!text) {
      return sock.sendMessage(chatId, { text: '❌ Usage: `.attp your text here`' }, { quoted: m });
    }

    try {
      // Generate blinking video via FFmpeg
      const mp4Buffer = await renderBlinkingVideoWithFfmpeg(text);

      // Convert to WebP with EXIF
      const webpPath = await writeExif({ data: mp4Buffer, mimetype: 'video/mp4' }, {
        packname: 'KAYA-MD',
        author: 'Kaya',
        categories: ['🤖']
      });

      const webpBuffer = fs.readFileSync(webpPath);
      try { fs.unlinkSync(webpPath); } catch (_) {}

      await sock.sendMessage(chatId, { sticker: webpBuffer }, { quoted: m });

    } catch (err) {
      console.error('[ATT-P] Error:', err);
      await sock.sendMessage(chatId, { text: '❌ Could not generate the sticker.' }, { quoted: m });
    }
  }
};

// ==================== FFmpeg Function ====================
function renderBlinkingVideoWithFfmpeg(text) {
  return new Promise((resolve, reject) => {
    const fontPath = process.platform === 'win32'
      ? 'C:/Windows/Fonts/arialbd.ttf'
      : '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

    const safeText = text
      .replace(/\\/g, '\\\\')
      .replace(/:/g, '\\:')
      .replace(/,/g, '\\,')
      .replace(/'/g, "\\'")
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/%/g, '\\%');

    const safeFont = process.platform === 'win32'
      ? fontPath.replace(/\\/g, '/').replace(':', '\\:')
      : fontPath;

    const cycle = 0.3;
    const dur = 1.8; // 6 cycles

    const drawRed   = `drawtext=fontfile='${safeFont}':text='${safeText}':fontcolor=red:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='lt(mod(t\\,${cycle})\\,0.1)'`;
    const drawBlue  = `drawtext=fontfile='${safeFont}':text='${safeText}':fontcolor=blue:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(mod(t\\,${cycle})\\,0.1\\,0.2)'`;
    const drawGreen = `drawtext=fontfile='${safeFont}':text='${safeText}':fontcolor=green:borderw=2:bordercolor=black@0.6:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2:enable='gte(mod(t\\,${cycle})\\,0.2)'`;

    const filter = `${drawRed},${drawBlue},${drawGreen}`;

    const args = [
      '-y',
      '-f', 'lavfi',
      '-i', `color=c=black:s=512x512:d=${dur}:r=20`,
      '-vf', filter,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart+frag_keyframe+empty_moov',
      '-t', String(dur),
      '-f', 'mp4',
      'pipe:1'
    ];

    const ff = spawn('ffmpeg', args);
    const chunks = [];
    const errors = [];

    ff.stdout.on('data', d => chunks.push(d));
    ff.stderr.on('data', e => errors.push(e));
    ff.on('error', reject);
    ff.on('close', code => {
      if (code === 0) return resolve(Buffer.concat(chunks));
      reject(new Error(Buffer.concat(errors).toString() || `ffmpeg exited with code ${code}`));
    });
  });
}