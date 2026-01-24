import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export default {
    name: 'photo',
    alias: ['p', 'image', 'topng'],
    description: 'Convert a sticker into a PNG image',
    category: 'Image',
    usage: '<reply to a sticker>',

    async execute(sock, m, args) {
        try {
            // Get the quoted message
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isQuotedSticker = quoted?.stickerMessage;
            const isSticker = m.message?.stickerMessage;

            if (!isQuotedSticker && !isSticker) {
                return sock.sendMessage(m.chat, {
                    text: '⚠️ *Usage:* Reply to a sticker with `.photo`\n\n*Examples:*\n• .photo (reply to a sticker)\n• .p (alias)'
                }, { quoted: m });
            }

            // Indicate bot is processing
            await sock.sendPresenceUpdate('composing', m.chat);

            // Helper: convert stream to Buffer
            const streamToBuffer = async (stream) => {
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                return Buffer.concat(chunks);
            };

            // Download the sticker
            let buffer;

            if (isQuotedSticker) {
                const stream = await downloadContentFromMessage(quoted.stickerMessage, 'sticker');
                buffer = await streamToBuffer(stream);
            } else {
                const stream = await downloadContentFromMessage(m.message.stickerMessage, 'sticker');
                buffer = await streamToBuffer(stream);
            }

            if (!buffer || buffer.length < 100) {
                return sock.sendMessage(m.chat, {
                    text: '❌ Cannot read this sticker (file too small or corrupted)'
                }, { quoted: m });
            }

            // Convert WebP to PNG using Sharp
            const pngBuffer = await sharp(buffer)
                .png()
                .toBuffer();

            // Temporary file path (optional, for debug)
            const tempPath = path.join(os.tmpdir(), `sticker_${Date.now()}.png`);
            await fs.writeFile(tempPath, pngBuffer);

            // Send the PNG image
            await sock.sendMessage(m.chat, {
                image: pngBuffer,
                caption: 'Sticker successfully converted to PNG',
                mimetype: 'image/png'
            }, { quoted: m });

            // Clean up temp file
            await fs.unlink(tempPath);

        } catch (error) {
            console.error('❌ Photo command error:', error);

            let errorMessage = '❌ An error occurred while converting the sticker.';

            if (error.message.includes('unsupported image format')) {
                errorMessage = '❌ Unsupported image format. Make sure it\'s a valid WebP sticker.';
            } else if (error.message.includes('input buffer contains unsupported image format')) {
                errorMessage = '❌ The sticker seems corrupted or in an unsupported format.';
            }

            sock.sendMessage(m.chat, { text: errorMessage }, { quoted: m });
        }
    }
};