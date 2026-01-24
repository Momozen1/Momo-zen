import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'vv',
    alias: ['v1', 'once'],
    category: 'Image',
    description: 'Allows viewing and saving a “view-once” image or video',

    async execute(kaya, m, args) {
        const chatId = m.chat;
        try {
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return await kaya.sendMessage(
                    chatId, 
                    { text: '❌ Please reply to a view-once image or video.' }, 
                    { quoted: m }
                );
            }

            // IMAGE view-once
            if (quoted.imageMessage?.viewOnce) {
                const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                return await kaya.sendMessage(
                    chatId,
                    {
                        image: buffer,
                        fileName: 'viewonce.jpg',
                        caption: quoted.imageMessage.caption || ''
                    },
                    { quoted: m }
                );
            }

            // VIDEO view-once
            if (quoted.videoMessage?.viewOnce) {
                const stream = await downloadContentFromMessage(quoted.videoMessage, 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                return await kaya.sendMessage(
                    chatId,
                    {
                        video: buffer,
                        fileName: 'viewonce.mp4',
                        caption: quoted.videoMessage.caption || ''
                    },
                    { quoted: m }
                );
            }

            return await kaya.sendMessage(
                chatId,
                { text: '❌ The quoted message is not a view-once image or video.' },
                { quoted: m }
            );

        } catch (err) {
            console.error('❌ viewonce command error:', err);
            await kaya.sendMessage(
                chatId,
                { text: '❌ Unable to retrieve the view-once media.' },
                { quoted: m }
            );
        }
    }
};