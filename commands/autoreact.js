// ==================== commands/autoreact.js ====================
import { saveBotModes } from '../system/botStatus.js';
import { contextInfo } from '../system/contextInfo.js';

// 🎲 Random emojis
const RANDOM_EMOJIS = [
  '❤️','😂','🎉','👍','🔥','😮','😢','🤔','👏','🎊','🤯','😍','🥰','😎','🤩','😭',
  '💯','✨','🌟','💔','💖','💕','💙','💚','💛','💜','🖤','🤍','🧡','💘','💝','💞',
  '😊','😇','🥳','😋','😜','🤪','😝','🤑','🤗','🤭','🤫','😴','🤖','👻','💀'
];

const getRandomEmoji = () =>
  RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)];

export default {
  name: 'autoreact',
  description: 'Enable or disable automatic reactions',
  category: 'Owner',
  ownerOnly: true, // ✅ Handler controls access

  run: async (kaya, m, args) => {
    try {
      global.botModes = global.botModes || {};
      global.botModes.autoreact = global.botModes.autoreact || { enabled: false };

      const action = args[0]?.toLowerCase();

      if (!['on', 'off', 'status', 'test'].includes(action)) {
        return kaya.sendMessage(
          m.chat,
          {
            text:
`🎭 *Usage:*
.autoreact on
.autoreact off
.autoreact status
.autoreact test

📌 *Function:*
The bot automatically reacts to messages with random emojis.`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // ✅ ON
      if (action === 'on') {
        global.botModes.autoreact.enabled = true;
        saveBotModes(global.botModes);

        const emoji = getRandomEmoji();
        await kaya.sendMessage(m.chat, { react: { text: emoji, key: m.key } });

        return kaya.sendMessage(
          m.chat,
          {
            text: `✅ *Auto-react enabled*\n\n🎲 Example emoji: ${emoji}`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // ❌ OFF
      if (action === 'off') {
        global.botModes.autoreact.enabled = false;
        saveBotModes(global.botModes);

        return kaya.sendMessage(
          m.chat,
          { text: '❌ *Auto-react disabled*', contextInfo },
          { quoted: m }
        );
      }

      // 📊 STATUS
      if (action === 'status') {
        const status = global.botModes.autoreact.enabled
          ? '✅ ENABLED'
          : '❌ DISABLED';

        return kaya.sendMessage(
          m.chat,
          {
            text: `🎭 *Auto-react*\n\nStatus: ${status}\nTotal emojis: ${RANDOM_EMOJIS.length}`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // 🧪 TEST
      if (action === 'test') {
        for (let i = 0; i < 5; i++) {
          setTimeout(async () => {
            try {
              await kaya.sendMessage(m.chat, {
                react: { text: getRandomEmoji(), key: m.key }
              });
            } catch {}
          }, i * 400);
        }

        return kaya.sendMessage(
          m.chat,
          { text: '🧪 *Auto-react test sent (5 emojis)*', contextInfo },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error('❌ autoreact error:', err);
      return kaya.sendMessage(
        m.chat,
        { text: '❌ An error occurred.', contextInfo },
        { quoted: m }
      );
    }
  }
};