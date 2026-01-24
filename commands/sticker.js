import { addExif } from '../lib/sticker.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Convertir une image en sticker',
    category: 'Sticker',
    usage: '<répondre à une image> ou <envoyer une image avec légende .sticker>',
    async execute(sock, m, args) {
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isQuotedImage = quoted?.imageMessage;
            const isImage = m.message?.imageMessage;
            
            if (!isQuotedImage && !isImage) {
                return sock.sendMessage(m.chat, {
                    text: '⚠️ *Usage:* Réponds à une image ou envoie une image avec la légende .sticker\n\n*Exemples:*\n• .sticker (en réponse à une image)\n• .s (alias)'
                }, { quoted: m });
            }

            // Indiquer que le bot traite l'image
            await sock.sendPresenceUpdate('composing', m.chat);

            // Télécharger le média avec la nouvelle méthode
            let downloadStream;
            if (isQuotedImage) {
                downloadStream = await downloadContentFromMessage(quoted.imageMessage, 'image');
            } else {
                downloadStream = await downloadContentFromMessage(m.message.imageMessage, 'image');
            }

            // Convertir le stream en Buffer
            const bufferChunks = [];
            for await (const chunk of downloadStream) {
                bufferChunks.push(chunk);
            }
            const buffer = Buffer.concat(bufferChunks);
            
            if (!buffer || buffer.length === 0) {
                return sock.sendMessage(m.chat, {
                    text: '❌ Erreur lors du téléchargement de l\'image (buffer vide)'
                }, { quoted: m });
            }

            // Créer le sticker
            const stickerOptions = {
                packname: global.packname || 'KAYA-MD',
                author: global.author || 'kaya-tech',
                categories: ['🤩', '🎉'],
                quality: 50
            };

            const stickerBuffer = await addExif(buffer, stickerOptions);
            
            // Envoyer le sticker
            await sock.sendMessage(m.chat, {
                sticker: stickerBuffer,
                mimetype: 'image/webp'
            }, { quoted: m });

        } catch (error) {
            console.error('❌ Erreur commande sticker:', error);
            sock.sendMessage(m.chat, {
                text: `❌ Erreur: ${error.message}\n\nAssure-toi que:\n• L'image n'est pas trop grande\n• Le format est supporté (jpg, png, webp)`
            }, { quoted: m });
        }
    }
};