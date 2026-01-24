import { BOT_NAME, getBotImage } from '../system/botAssets.js';
import config from '../config.js';

// ===================== FORMAT UPTIME =====================
function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

export default {
  name: 'ping',
  aliases: [],
  category: 'General',
  description: '🏓 Check bot latency and status',
  ownerOnly: false,
  group: false,

  run: async (kaya, m) => {
    try {
      const start = Date.now();

      // Ping léger pour mesurer la latence
      await kaya.sendMessage(m.chat, { text: '🏓 Pong...' }, { quoted: m });

      const latency = Date.now() - start;
      const uptime = formatUptime(process.uptime());
      const mode = config.public ? 'PUBLIC' : 'PRIVATE';

      const message = `
▉─『 🏓 ${BOT_NAME} 』─▉
┃ ✅ Status   : Online & Ready
┃ ⏱️ Latency  : ${latency} ms
┃ ⌛ Uptime   : ${uptime}
▉─────────────────▉
      `.trim();

      await kaya.sendMessage(
        m.chat,
        {
          image: { url: getBotImage() }, // image du bot auto
          caption: message
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ ping.js error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '⚠️ Unable to check latency. Please try again.' },
        { quoted: m }
      );
    }
  }
};