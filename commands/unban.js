// ==================== commands/unban.js ====================
import fs from 'fs';
import path from 'path';

const BANNED_FILE = path.join(process.cwd(), 'data', 'banned.json');

// 🔹 Load banned users
function loadBannedUsers() {
  if (!fs.existsSync(BANNED_FILE)) {
    fs.writeFileSync(BANNED_FILE, JSON.stringify([], null, 2));
  }
  return new Set(JSON.parse(fs.readFileSync(BANNED_FILE, 'utf-8')));
}

function saveBannedUsers(bannedSet) {
  fs.writeFileSync(BANNED_FILE, JSON.stringify(Array.from(bannedSet), null, 2));
  global.bannedUsers = bannedSet;
}

// Load globally on startup
if (!global.bannedUsers) global.bannedUsers = loadBannedUsers();

export default {
  name: 'unban',
  description: '✅ Unban a user from the bot',
  category: 'Owner',
  ownerOnly: true, // only the owner

  run: async (sock, m, args) => {
    try {
      let target;

      // 1️⃣ Mention
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      // 2️⃣ Reply to a message
      else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }
      // 3️⃣ Written number
      else if (args[0]) {
        target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      }

      if (!target)
        return sock.sendMessage(m.chat, { text: '⚠️ User not found to unban.' }, { quoted: m });

      const banned = global.bannedUsers || new Set();
      if (!banned.has(target))
        return sock.sendMessage(m.chat, { text: '⚠️ This user is not banned.', quoted: m });

      banned.delete(target);
      saveBannedUsers(banned);

      await sock.sendMessage(
        m.chat,
        { text: `✅ User ${target.split('@')[0]} has been unbanned from the bot.` },
        { quoted: m }
      );
    } catch (err) {
      console.error('❌ Unban command error:', err);
      await sock.sendMessage(m.chat, { text: '❌ Unable to unban this user.' }, { quoted: m });
    }
  }
};