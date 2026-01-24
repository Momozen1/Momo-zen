import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { addExif } from '../lib/sticker.js';

export default {
    name: 'take',
    alias: ['steal', 'reprendre', 'vol'],
    description: 'Reprend un média avec seulement le pseudo comme auteur (pas de pack)',
    category: 'Sticker',
    usage: '<répondre à un sticker/image/vidéo> [texte optionnel]',
    async execute(sock, m, args) {
        try {
            // Récupérer le pseudo de l'utilisateur
            const pushName = m.pushName || m.sender.split('@')[0] || "User";
            
            // Combiner pseudo + texte optionnel des arguments
            let authorName = pushName;
            if (args.length > 0) {
                authorName += ` ${args.join(' ')}`;
            }

            // Vérifier le message cité ou le message courant
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isQuoted = quoted && (quoted.stickerMessage || quoted.imageMessage || quoted.videoMessage);
            const isCurrent = m.message && (m.message.stickerMessage || m.message.imageMessage || m.message.videoMessage);
            
            if (!isQuoted && !isCurrent) {
                return sock.sendMessage(m.chat, {
                    text: '⚠️ *Usage:* Réponds à un sticker/image/vidéo\n\n*Exemples:*\n• .take (en réponse)\n• .take dom (ajoute "dom")\n• .take (média envoyé)'
                }, { quoted: m });
            }

            await sock.sendPresenceUpdate('composing', m.chat);

            // Fonction pour convertir stream en Buffer
            const streamToBuffer = async (stream) => {
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                return Buffer.concat(chunks);
            };

            // Télécharger le média
            let buffer;
            
            if (isQuoted) {
                if (quoted.stickerMessage) {
                    const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
                    buffer = await streamToBuffer(stream);
                } else if (quoted.imageMessage) {
                    const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
                    buffer = await streamToBuffer(stream);
                } else if (quoted.videoMessage) {
                    const stream = await downloadContentFromMessage(quoted.videoMessage, 'video');
                    buffer = await streamToBuffer(stream);
                }
            } else {
                if (m.message.stickerMessage) {
                    const stream = await downloadContentFromMessage(m.message.stickerMessage, 'sticker');
                    buffer = await streamToBuffer(stream);
                } else if (m.message.imageMessage) {
                    const stream = await downloadContentFromMessage(m.message.imageMessage, 'image');
                    buffer = await streamToBuffer(stream);
                } else if (m.message.videoMessage) {
                    const stream = await downloadContentFromMessage(m.message.videoMessage, 'video');
                    buffer = await streamToBuffer(stream);
                }
            }

            if (!buffer || buffer.length < 100) {
                return sock.sendMessage(m.chat, {
                    text: '❌ Impossible de lire ce média'
                }, { quoted: m });
            }

            // Options du sticker - SEULEMENT l'auteur, PAS de pack
            const stickerOptions = {
                packname: '', // CHANGÉ : chaine vide pour supprimer le pack
                author: authorName, // Seulement le pseudo (+ texte optionnel)
                categories: ['🎨'], // Optionnel
                quality: 70,
                type: StickerTypes.FULL
            };

            // Créer le sticker
            let stickerBuffer;
            
            if (typeof addExif === 'function') {
                stickerBuffer = await addExif(buffer, stickerOptions);
            } else {
                const sticker = new Sticker(buffer, {
                    pack: '', // CHANGÉ : chaine vide
                    author: authorName, // Seulement l'auteur
                    type: StickerTypes.FULL,
                    categories: ['🎨'],
                    quality: 70,
                    background: 'transparent'
                });
                stickerBuffer = await sticker.toBuffer();
            }

            // Envoyer UNIQUEMENT le sticker
            await sock.sendMessage(m.chat, {
                sticker: stickerBuffer,
                mimetype: 'image/webp'
            }, { quoted: m });

        } catch (error) {
            console.error('❌ Erreur commande take:', error);
            
            let errorMessage = '❌ Erreur lors de la création du sticker.';
            
            if (error.message.includes('unsupported image')) {
                errorMessage = '❌ Format de média non supporté.';
            } else if (error.message.includes('corrupt')) {
                errorMessage = '❌ Le média semble corrompu.';
            }
            
            sock.sendMessage(m.chat, {
                text: errorMessage
            }, { quoted: m });
        }
    }
};