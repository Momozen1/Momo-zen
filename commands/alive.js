// ==================== commands/alive.js ====================
import config from '../config.js';
import { BOT_NAME, BOT_VERSION, getBotImage } from '../system/botAssets.js';

// ===================== FORMAT UPTIME =====================
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

export default {
  name: 'alive',
  description: 'Shows that the bot is online',
  category: 'General',
  ownerOnly: false,

  run: async (kaya, m) => {
    try {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const date = now.toLocaleDateString('en-US');
      const uptime = formatUptime(process.uptime());
      const mode = config.public ? 'PUBLIC' : 'PRIVATE';

      const message = `
▉──『 ${BOT_NAME} 』──▉
┃ 🤖 Status  : *ONLINE*
┃ 🌐 Mode    : ${mode}
┃ ⏰ Time    : ${time}
┃ 📅 Date    : ${date}
┃ ⌛ Uptime  : ${uptime}
┃ 🚀 Version : ${BOT_VERSION}
▉─────────────────▉

`;

      await kaya.sendMessage(
        m.chat,
        {
          image: { url: getBotImage() }, // image auto (URL ou fichier local)
          caption: message
        },
        { quoted: m }
      );
    } catch (err) {
      console.error('Error alive.js :', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Unable to check bot status.' },
        { quoted: m }
      );
    }
  }
};