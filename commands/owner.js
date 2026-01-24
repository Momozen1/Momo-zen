// ================= commands/info.js =================
import { BOT_NAME, getBotImage } from '../system/botAssets.js';

export default {
  name: 'owner',
  aliases: ['dev', 'creator'],
  description: 'Shows information about the bot developer',
  category: 'General',

  execute: async (kaya, m) => {
    const caption = `
╭──〔 ${BOT_NAME} 〕──⬣
│ 👤 Developer : KAYA
│ 🌍 Country   : DR Congo 🇨🇩
│
│ 🔗 Official Links
│
│ • WhatsApp : wa.me/243999585890
│
│ • YouTube  : youtube.com/@TECHword-1
│
│ • GitHub   : github.com/Kaya2005/KAYA-MD
│
│ • Telegram : t.me/techword1
╰─────────────⬣
`.trim();

    await kaya.sendMessage(
      m.chat,
      {
        image: { url: getBotImage() }, // image auto (URL ou locale)
        caption,
        contextInfo: { mentionedJid: [m.sender] } // mentionne l'utilisateur
      },
      { quoted: m }
    );
  }
};