// ==================== commands/menu.js ====================
import fs from 'fs';
import path from 'path';
import { contextInfo } from '../system/contextInfo.js';
import { BOT_NAME, BOT_SLOGAN, BOT_VERSION, getBotImage } from '../system/botAssets.js';
import config from '../config.js';

// ===================== FORMAT UPTIME =====================
function formatUptime(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / (1000 * 60)) % 60;
  const h = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${d}j ${h}h ${m}m ${s}s`;
}

// ===================== CHARGER COMMANDES =====================
async function loadCommands() {
  const commandsDir = path.join(process.cwd(), 'commands');
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

  const categories = {};

  for (const file of files) {
    try {
      const cmd = (await import(`./${file}`)).default;
      if (!cmd?.name) continue;

      const cat = (cmd.category || 'GÉNÉRAL').toUpperCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(`.${cmd.name}`);
    } catch (err) {
      console.error('Erreur load command:', file, err.message);
    }
  }

  return categories;
}

export default {
  name: 'menu',
  description: 'Affiche le menu du bot (Solo Leveling)',

  async execute(Kaya, m) {
    const now = new Date();
    const user = m.sender.split('@')[0];
    const uptime = formatUptime(process.uptime() * 1000);

    const categories = await loadCommands();
    const totalCmds = Object.values(categories).reduce((a, b) => a + b.length, 0);

    // ===================== HEADER SOLO LEVELING =====================
    let menuText = `
╔═══════════════════════╗
 『 A V I S  D U  S Y S T È M E 』
╚═══════════════════════╝

👤 Chasseur : @${user}
🤖 Bot      : ${BOT_NAME}
🧬 Version  : ${BOT_VERSION}
⚔️ Rang     : NON ÉVEILLÉ
💠 Mana     : ∞
⏳ Uptime   : ${uptime}
📦 Commandes: ${totalCmds}

╔══════════════════════╗
   『 M E N U  D O N J O N 』
╚══════════════════════╝
`;

    // ===================== MENUS PAR CATÉGORIE =====================
    const sortedCats = Object.keys(categories).sort(
      (a, b) => categories[b].length - categories[a].length
    );

    for (const cat of sortedCats) {
      const cmds = categories[cat];
      menuText += `
『 ⚔️ ${cat} 』
╭────────────────────────
│ ${cmds.join('\n│ ')}
╰────────────────────────
`;
    }

    // ===================== FOOTER =====================
    menuText += `
╔════════════════════╗
   ⚠ 『  S Y S T È M E 』
╚════════════════════╝

📈 Progresse chaque jour.
⚔️ Survis aux donjons.
👑 Deviens le plus fort.

${BOT_SLOGAN}
`;

    // ===================== ENVOI =====================
    await Kaya.sendMessage(
      m.chat,
      {
        image: { url: getBotImage() },
        caption: menuText,
        contextInfo: {
          ...contextInfo,
          mentionedJid: [m.sender],
        },
      }
    );
  },
};