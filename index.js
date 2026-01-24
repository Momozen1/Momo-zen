// ================== CORE ==================
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import pino from 'pino';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
global.menuSessions = {};
// ================== CONFIG & GLOBALS ==================
import config from './config.js';
import './system/globals.js';
import { loadBotModes } from './system/botStatus.js';
loadBotModes();

// ================== ASSETS & UTILS ==================
import { connectionMessage, getBotImage } from './system/botAssets.js';
import { checkUpdate } from './system/updateChecker.js';
import { loadSessionFromMega } from './system/megaSession.js';

// ================== HANDLER ==================
import handleCommand, {
  smsg,
  loadCommands,
  commands,
  handleParticipantUpdate
} from './handler.js';

// ================== BAILEYS ==================
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidDecode,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';

// ================== PATH ==================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== CRYPTO FIX ==================
if (!globalThis.crypto?.subtle) {
  globalThis.crypto = crypto.webcrypto;
}

// ================== GLOBAL CONFIG ==================
global.owner ??= [config.OWNER_NUMBER];
global.SESSION_ID ??= config.SESSION_ID;

global.botModes ??= {
  typing: false,
  recording: false,
  autoreact: { enabled: false },
  autoread: { enabled: false }
};

global.autoStatus ??= false;
global.botStartTime = Date.now();

// ================== SESSION ==================
const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

// ================== START BOT ==================
async function startBot() {
  try {
    // ===== Load session Mega (si existante)
    await loadSessionFromMega(credsPath);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      auth: state,
      version,
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false
    });

    // ================== JID NORMALIZER ==================
    sock.decodeJid = jid => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const d = jidDecode(jid) || {};
        return d.user && d.server ? `${d.user}@${d.server}` : jid;
      }
      return jid;
    };

    // ================== LOAD COMMANDS (ONCE) ==================
    await loadCommands();
    console.log(chalk.cyan(`📂 Commandes chargées : ${Object.keys(commands).length}`));

        // ================== CONNECTION ==================
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'open') {
        console.log(chalk.green('✅ MOMO-ZEN CONNECTÉ'));

        try {
          const jid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
          await sock.sendMessage(jid, {
            image: { url: getBotImage() },
            caption: connectionMessage()
          });
        } catch {}

        await checkUpdate(sock);
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log(chalk.red('❌ Déconnecté :'), reason);

        if (reason !== DisconnectReason.loggedOut) {
          setTimeout(startBot, 5000);
        } else {
          console.log(chalk.red('🚫 Session expirée – supprime session/creds.json'));
        }
      }
    });

    // ================== MESSAGES ==================
    sock.ev.on('messages.upsert', async ({ messages }) => {
      if (!messages?.length) return;

      const valid = messages.filter(m => m?.message);

      for (const msg of valid) {
        try {
          const m = smsg(sock, msg);
          if (!m.body?.trim()) continue;
          await handleCommand(sock, msg);
        } catch (err) {
          console.error('❌ Message handler error:', err);
        }
      }
    });

    // ================== GROUP EVENTS ==================
    sock.ev.on('group-participants.update', update =>
      handleParticipantUpdate(sock, update).catch(() => {})
    );

    // ================== CREDS ==================
    sock.ev.on('creds.update', saveCreds);

    return sock;

  } catch (err) {
    console.error('❌ ERREUR FATALE:', err);
    process.exit(1);
  }
}

// ================== RUN ==================
startBot();

// ================== GLOBAL ERRORS ==================
process.on('unhandledRejection', err =>
  console.error('UnhandledRejection:', err)
);
process.on('uncaughtException', err =>
  console.error('UncaughtException:', err)
);