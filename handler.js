// ==================== handler.js ====================
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import config from './config.js';
import { handleMention } from './system/mentionHandler.js';
import {
  storeMessage,
  downloadContentFromMessage,
  uploadImage,
  handleAutoread,
  handleBotModes
} from './system/initModules.js';
import checkAdminOrOwner from './system/checkAdmin.js';
import { WARN_MESSAGES } from './system/warnMessages.js';

// ================== 🔹 Gestion persistante des globals ==================
const SETTINGS_FILE = './data/settings.json';
let savedSettings = {};
try {
  savedSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
} catch {
  console.log('Aucune sauvegarde existante, utilisation des valeurs par défaut.');
}

// ================== 🔹 Initialisation sécurisée ==================
const commands = {};
global.groupThrottle ??= savedSettings.groupThrottle || {};
global.userThrottle ??= new Set(savedSettings.userThrottle || []);
global.disabledGroups ??= new Set(savedSettings.disabledGroups || []);
global.botModes ??= savedSettings.botModes || {
  typing: false,
  recording: false,
  autoread: { enabled: false }
};

// ================== 🔹 Globals AntiBot ==================
global.antiBotGroups ??= {};
global.botWarns ??= {};
global.messageRate ??= {};

// ================== 🔹 Sauvegarde avec debounce (SAFE) ==================
let saveTimeout;
function saveSettings() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const data = {
      groupThrottle: global.groupThrottle,
      userThrottle: Array.from(global.userThrottle),
      disabledGroups: Array.from(global.disabledGroups),
      botModes: global.botModes
    };
    fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2), () => {});
  }, 2000);
}

// ================== 🔹 Wrappers groupes ==================
global.disableGroup = chatId => {
  global.disabledGroups.add(chatId);
  saveSettings();
};
global.enableGroup = chatId => {
  global.disabledGroups.delete(chatId);
  saveSettings();
};

// ================== 📂 Chargement commandes (UNE FOIS) ==================
let commandsLoaded = false;
const loadCommands = async (dir = './commands') => {
  if (commandsLoaded) return;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      await loadCommands(fullPath);
      continue;
    }

    if (!file.endsWith('.js')) continue;

    const module = await import(pathToFileURL(fullPath).href);
    const cmd = module.default || module;

    if (cmd?.name) {
      commands[cmd.name.toLowerCase()] = cmd;
    }
  }

  commandsLoaded = true;
};

// ================== 🧠 smsg ==================
const smsg = (sock, m) => {
  if (!m?.message) return {};

  const msg = m.message;
  const body =
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    '';

  return {
    ...m,
    body,
    chat: m.key.remoteJid,
    id: m.key.id,
    fromMe: m.key.fromMe,
    sender: m.key.fromMe
      ? sock.user.id
      : (m.key.participant || m.key.remoteJid || ''),
    isGroup: m.key.remoteJid.endsWith('@g.us'),
    mentionedJid: msg.extendedTextMessage?.contextInfo?.mentionedJid || []
  };
};

// ================== SIMULATION TYPING / RECORDING ==================
const typingSessions = new Map();
async function simulateTypingRecording(sock, chatId) {
  if (!chatId || typingSessions.has(chatId)) return;

  const timer = setInterval(async () => {
    try {
      if (global.botModes.typing)
        await sock.sendPresenceUpdate('composing', chatId);
      if (global.botModes.recording)
        await sock.sendPresenceUpdate('recording', chatId);
    } catch {}
  }, 30000);

  typingSessions.set(chatId, timer);
  setTimeout(() => {
    clearInterval(timer);
    typingSessions.delete(chatId);
  }, 120000);
}

// ================== 👰 HANDLER COMMANDES ==================
async function handleCommand(sock, mRaw) {
  try {
    if (!mRaw?.message) return;

    const m = smsg(sock, mRaw);
    const body = m.body?.trim();
    if (!body) return;

    const PREFIX = global.PREFIX || config.PREFIX;
    let isCommand = false;
    let commandName = '';
    let args = [];

    if (body.startsWith(PREFIX)) {
      const parts = body.slice(PREFIX.length).trim().split(/\s+/);
      commandName = parts.shift()?.toLowerCase();
      args = parts;
      if (commands[commandName]) isCommand = true;
    }

    // ===== 🔥 AJOUT BLOC onMention 🔥 =====
    for (const cmd of Object.values(commands)) {
      if (typeof cmd.onMention === "function") {
        await cmd.onMention(sock, m);
      }
    }
    // =====================================

    // … 🔥 TOUT LE RESTE EST INCHANGÉ 🔥

    const cmd = commands[commandName];
    if (!cmd) return;

    if (cmd.execute) await cmd.execute(sock, m, args, storeMessage);
    else if (cmd.run) await cmd.run(sock, m, args, storeMessage);

    saveSettings();
  } catch (err) {
    console.error('❌ Handler error:', err);
  }
}

// ================== 👥 Participant update ==================
async function handleParticipantUpdate(sock, update) {
  try {
    for (const cmd of Object.values(commands)) {
      if (typeof cmd.participantUpdate === 'function') {
        await cmd.participantUpdate(sock, update).catch(() => {});
      }
    }
  } catch (err) {
    console.error('❌ handleParticipantUpdate error:', err);
  }
}

// ================== EXPORT ==================
export { loadCommands, commands, smsg, handleParticipantUpdate, saveSettings };
export default handleCommand;