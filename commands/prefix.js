import config, { saveConfig } from '../config.js';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'prefix',
  description: 'Change or display the bot prefix (KAYA-MD)',
  category: 'Owner',
  ownerOnly: true,

  run: async (sock, m, args) => {
    try {
      // 📌 Show current prefix if no argument
      if (!args[0]) {
        return sock.sendMessage(
          m.chat,
          {
            text: `
🔧 *CURRENT PREFIX*
━━━━━━━━━━━━━━━━━━
➡️ Prefix: \`${global.PREFIX || config.PREFIX}\`

💡 To change the prefix: .prefix <new prefix>
            `.trim(),
            contextInfo
          },
          { quoted: m }
        );
      }

      const newPrefix = args.join(' '); // accept any text, symbols, emojis, multiple characters

      // 💾 Save config
      saveConfig({ PREFIX: newPrefix });

      // ⚡ Update global prefix immediately
      global.PREFIX = newPrefix;

      await sock.sendMessage(
        m.chat,
        {
          text: `
✅ *PREFIX SUCCESSFULLY UPDATED*
━━━━━━━━━━━━━━━━━━
➡️ New prefix: \`${newPrefix}\`

⚡ All users must now use this prefix.
          `.trim(),
          contextInfo
        },
        { quoted: m }
      );

    } catch (err) {
      console.error('❌ prefix error:', err);
      return sock.sendMessage(
        m.chat,
        { text: '❌ An error occurred while changing the prefix (KAYA-MD).', contextInfo },
        { quoted: m }
      );
    }
  }
};