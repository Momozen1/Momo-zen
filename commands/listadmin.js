// ==================== commands/staff.js ====================
import decodeJid from '../system/decodeJid.js'; // Pour normaliser les JID multi-device

export default {
    name: 'listadmin',
    alias: ['admins', 'mod'],
    category: 'Groupe',
    description: 'Affiche la liste des admins du groupe',
    group: true,
    async execute(sock, m, args) {
        const chatId = m.chat;

        try {
            // Récupérer les métadonnées du groupe
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants;

            // Récupérer la photo de profil du groupe
            let pp;
            try {
                pp = await sock.profilePictureUrl(chatId, 'image');
            } catch {
                pp = 'https://i.imgur.com/2wzGhpF.jpeg'; // image par défaut
            }

            // Filtrer les admins
            const groupAdmins = participants.filter(p => p.admin);
            const owner = metadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

            // Préparer la liste des admins avec mentions
            const listAdmin = groupAdmins
                .map((p, i) => `${i + 1}. @${decodeJid(p.id).split('@')[0]}`)
                .join('\n▢ ');

            const text = `
≡ *GROUP ADMINS* _${metadata.subject}_

┌─⊷ *ADMINS*
▢ ${listAdmin}
└───────────
`.trim();

            await sock.sendMessage(chatId, {
                image: { url: pp },
                caption: text,
                mentions: [...groupAdmins.map(p => decodeJid(p.id)), owner]
            }, { quoted: m });

        } catch (err) {
            console.error('❌ staff command error:', err);
            await sock.sendMessage(chatId, { text: '❌ Impossible de récupérer la liste des admins.' }, { quoted: m });
        }
    }
};