// ==================== commands/anticall.js ====================
import fs from 'fs';
import path from 'path';
import { contextInfo } from '../system/contextInfo.js';

// 📂 Save file
const ANTICALL_PATH = path.join(process.cwd(), 'data/anticall.json');

// ----------------- Load & Save State -----------------
function readState() {
  try {
    if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
    const raw = fs.readFileSync(ANTICALL_PATH, 'utf8');
    const data = JSON.parse(raw || '{}');
    return { enabled: !!data.enabled };
  } catch {
    return { enabled: false };
  }
}

function writeState(enabled) {
  try {
    if (!fs.existsSync(path.dirname(ANTICALL_PATH))) fs.mkdirSync(path.dirname(ANTICALL_PATH), { recursive: true });
    fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
  } catch {}
}

// ----------------- Global Initialization -----------------
if (!global.anticallState) global.anticallState = readState();

export default {
  name: 'anticall',
  description: 'Enable or disable automatic call blocking',
  category: 'Groupe',
  group: false,
  admin: false,
  ownerOnly: true, // Owner only

  run: async (kaya, m, args) => {
    const chatId = m.chat;
    try {
      const sub = args[0]?.toLowerCase() || '';

      // ❌ Invalid usage
      if (!['on', 'off', 'status'].includes(sub)) {
        return kaya.sendMessage(chatId, {
          text: `*ANTICALL COMMAND*\n\n` +
                `.anticall on     → Enable automatic call blocking\n` +
                `.anticall off    → Disable automatic call blocking\n` +
                `.anticall status → Check current status`
        }, { quoted: m });
      }

      // ℹ️ Status check
      if (sub === 'status') {
        const state = readState();
        return kaya.sendMessage(chatId, {
          text: `Anticall is currently *${state.enabled ? 'ENABLED' : 'DISABLED'}*`
        }, { quoted: m });
      }

      // ➕ Toggle state
      const enable = sub === 'on';
      writeState(enable);
      global.anticallState.enabled = enable;

      return kaya.sendMessage(chatId, {
        text: `✅ Anticall is now *${enable ? 'ENABLED' : 'DISABLED'}*`
      }, { quoted: m });

    } catch (err) {
      console.error('❌ ANTICALL ERROR:', err);
      return kaya.sendMessage(chatId, {
        text: '❌ An error occurred with the anticall command.',
        contextInfo
      }, { quoted: m });
    }
  }
};