import fs from 'fs';
import path from 'path';

const BANNED_FILE = path.join(process.cwd(), 'data', 'banned.json');

// 🔹 Init banned users file
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

// Load at startup
global.bannedUsers = loadBannedUsers();

export default {
  name: 'ban',
  description: '🚫 Ban a user from the bot',
  category: 'Owner',
  ownerOnly: true,

  run: async (sock, m, args) => {
    try {
      let target;

      // 1️⃣ Mention
      if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      // 2️⃣ Reply
      else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
        target = m.message.extendedTextMessage.contextInfo.participant;
      }
      // 3️⃣ Number
      else if (args[0]) {
        target = args[0].replace(/\D/g, '') + '@s.whatsapp.net';
      }

      if (!target) return sock.sendMessage(m.chat, { text: '⚠️ User not found.' }, { quoted: m });

      const banned = global.bannedUsers || new Set();
      if (banned.has(target)) return sock.sendMessage(m.chat, { text: '⚠️ User already banned.' }, { quoted: m });

      banned.add(target);
      saveBannedUsers(banned);

      await sock.sendMessage(m.chat, { text: `✅ User ${target.split('@')[0]} is now banned.` }, { quoted: m });
    } catch (err) {
      console.error('❌ Ban command error:', err);
      await sock.sendMessage(m.chat, { text: '❌ Could not ban user.' }, { quoted: m });
    }
  }
};