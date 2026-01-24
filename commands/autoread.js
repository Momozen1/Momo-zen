// ==================== commands/autoread.js ====================
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'autoread.json');

// 🎛️ Initialisation ou lecture du config JSON
function initConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ enabled: false }, null, 2));
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

// 👀 Vérifie si le bot est mentionné dans un message
function isBotMentionedInMessage(message, botNumber) {
  if (!message.message) return false;

  const messageTypes = [
    'extendedTextMessage', 'imageMessage', 'videoMessage', 'stickerMessage',
    'documentMessage', 'audioMessage', 'contactMessage', 'locationMessage'
  ];

  for (const type of messageTypes) {
    if (message.message[type]?.contextInfo?.mentionedJid) {
      if (message.message[type].contextInfo.mentionedJid.includes(botNumber)) return true;
    }
  }

  const text = message.message.conversation ||
               message.message.extendedTextMessage?.text ||
               message.message.imageMessage?.caption ||
               message.message.videoMessage?.caption || '';

  if (text) {
    const botUsername = botNumber.split('@')[0];
    if (text.includes(`@${botUsername}`)) return true;

    const botNames = [global.botname?.toLowerCase(), 'bot', 'kaya', 'kaya bot'];
    const words = text.toLowerCase().split(/\s+/);
    if (botNames.some(name => words.includes(name))) return true;
  }

  return false;
}

// ✅ Fonction principale pour lire automatiquement les messages
export async function handleAutoread(sock, m) {
  try {
    const config = initConfig();
    if (!config.enabled) return false;

    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const mentioned = isBotMentionedInMessage(m, botNumber);

    if (mentioned) return false; // ne pas lire si bot mentionné

    const key = { remoteJid: m.key.remoteJid, id: m.key.id, participant: m.key.participant };
    await sock.readMessages([key]);
    return true;
  } catch (err) {
    console.error('[AUTOREAD]', err);
    return false;
  }
}

// ⚙️ Commande autoread pour l’utilisateur
export default {
  name: 'autoread',
  description: 'Activer ou désactiver la lecture automatique des messages',
  category: 'Owner',
  ownerOnly: true, // ✅ géré par le handler

  run: async (kaya, m, args) => {
    try {
      const config = initConfig();
      const action = args[0]?.toLowerCase();

      if (action === 'on' || action === 'enable') config.enabled = true;
      else if (action === 'off' || action === 'disable') config.enabled = false;
      else if (!action) config.enabled = !config.enabled;
      else return kaya.sendMessage(
        m.chat,
        { text: '❌ Option invalide ! Utilise : .autoread on/off' },
        { quoted: m }
      );

      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

      await kaya.sendMessage(
        m.chat,
        { text: `✅ Auto-read est maintenant ${config.enabled ? 'activé' : 'désactivé'} !` },
        { quoted: m }
      );

    } catch (err) {
      console.error('[AUTOREAD CMD]', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Une erreur est survenue lors de la commande.' },
        { quoted: m }
      );
    }
  }
};