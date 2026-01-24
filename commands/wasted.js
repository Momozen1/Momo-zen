// ==================== commands/wasted.js ====================
import axios from 'axios';

export default {
    name: 'wasted',
    alias: ['rip', 'dead'],
    category: 'Fun',
    description: 'Ajoute l’effet Wasted sur la photo de profil d’un utilisateur',
    async execute(kaya, m, args) {
        const chatId = m.chat;
        let userToWaste;

        // Vérifie les mentions
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToWaste = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } 
        // Vérifie la réponse à un message
        else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWaste = m.message.extendedTextMessage.contextInfo.participant;
        } 
        // Sinon, utilise l'auteur du message
        else {
            userToWaste = m.sender;
        }

        try {
            // Récupère la photo de profil
            let profilePic;
            try {
                profilePic = await kaya.profilePictureUrl(userToWaste, 'image');
            } catch {
                profilePic = 'https://i.imgur.com/2wzGhpF.jpeg'; // Image par défaut
            }

            // Appel à l'API Wasted
            const response = await axios.get(
                `https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(profilePic)}`,
                { responseType: 'arraybuffer' }
            );

            // Envoie l'image avec mention
            await kaya.sendMessage(chatId, {
                image: Buffer.from(response.data),
                caption: `⚰️ *Wasted* : @${userToWaste.split('@')[0]} 💀\nRest in pieces!`,
                mentions: [userToWaste]
            }, { quoted: m });

        } catch (err) {
            console.error('❌ wasted command error:', err);
            await kaya.sendMessage(chatId, { text: '❌ Impossible de créer l’image Wasted. Réessaie plus tard.' }, { quoted: m });
        }
    }
};