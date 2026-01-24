// ================= commands/repo.js =================
import { BOT_NAME, getBotImage } from '../system/botAssets.js';

export default {
  name: 'repo',
  aliases: ['github', 'source'],
  description: 'Shows the bot GitHub repository',
  category: 'General',

  execute: async (kaya, m) => {
    const caption = `
╭──〔 ${BOT_NAME} 〕──⬣
│ 💻 Source Code Repository
│ 🌟 Open Source Project
╰─────────────⬣

🔗 GitHub Repository
https://github.com/Kaya2005/KAYA-MD

⭐ Don’t forget to star the repo
🚀 Powered by KAYA
`.trim();

    await kaya.sendMessage(
      m.chat,
      {
        image: { url: getBotImage() },
        caption
      },
      { quoted: m }
    );
  }
};