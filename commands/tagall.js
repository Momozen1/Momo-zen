import checkAdminOrOwner from '../system/checkAdmin.js';

export default {
  name: "tagall",
  description: "Tag tous les membres (Style Solo Leveling)",

  async execute(sock, m, args) {
    if (!m.isGroup) 
      return sock.sendMessage(m.chat, { text: "⚠️ Cette commande est réservée aux donjons (groupes)." });

    const isAdmin = await checkAdminOrOwner(sock, m);
    if (!isAdmin) 
      return sock.sendMessage(m.chat, { text: "❌ Seul un Maître du Donjon peut utiliser cette commande." });

    const metadata = await sock.groupMetadata(m.chat);
    const participants = metadata.participants;

    const groupName = metadata.subject;
    const groupSize = participants.length;
    const date = new Date().toLocaleString();

    let mentions = [];
    let tagText = "";

    for (let p of participants) {
      mentions.push(p.id);
      tagText += `⚔️ @${p.id.split("@")[0]}\n`;
    }

    const tagallText = `
╔════════════════════════╗
  『 A V I S  D U  S Y S T È M E 』
╚════════════════════════╝

👑 Maître du Donjon : @${m.sender.split("@")[0]}
🏰 Donjon          : *${groupName}*
👥 Chasseurs       : ${groupSize}
📆 Date système    : ${date}

⚠️ [ APPEL DU SYSTÈME ]
Tous les chasseurs sont convoqués !

${tagText}

⚔️ Survis.
📈 Progresse.
👑 Deviens plus fort.
`;

    await sock.sendMessage(m.chat, {
      text: tagallText,
      mentions
    });
  }
};