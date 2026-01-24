// ==================== commands/ss.js ====================
import fetch from 'node-fetch';

export default {
    name: 'ss',
    alias: ['ssweb', 'screenshot'],
    category: 'Image',
    description: 'Takes a screenshot of a website',
    usage: '.ss <url>',
    async execute(sock, m, args) {
        const chatId = m.chat;
        const url = args.join(' ').trim();

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: `*SCREENSHOT TOOL*\n\nUsage:\n.ss <url>\n.ssweb <url>\n.screenshot <url>\n\nExample:\n.ss https://example.com`
            }, { quoted: m });
        }

        // ✅ Validate URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return await sock.sendMessage(chatId, {
                text: '❌ Please provide a valid URL starting with http:// or https://',
                quoted: m
            });
        }

        try {
            // Indicate bot is typing
            await sock.presenceSubscribe(chatId);
            await sock.sendPresenceUpdate('composing', chatId);

            // Main API
            const apiUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&theme=light&device=desktop`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const response = await fetch(apiUrl, {
                headers: { 
                    'accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`API responded with status ${response.status}`);
            const buffer = await response.buffer();

            // Send the image
            await sock.sendMessage(chatId, {
                image: buffer,
                caption: `📸 Screenshot of: ${url}`
            }, { quoted: m });

        } catch (err) {
            console.error('❌ Error in ss command:', err);

            // Fallback option if main API fails
            try {
                const fallbackUrl = `https://api.screenshotmachine.com?key=YOUR_KEY&url=${encodeURIComponent(url)}&dimension=1024x768`;
                const fallbackResp = await fetch(fallbackUrl);
                if (!fallbackResp.ok) throw new Error(`Fallback API status ${fallbackResp.status}`);
                const fallbackBuf = await fallbackResp.buffer();

                await sock.sendMessage(chatId, {
                    image: fallbackBuf,
                    caption: `📸 Screenshot (fallback) of: ${url}`
                }, { quoted: m });

            } catch {
                await sock.sendMessage(chatId, {
                    text: '❌ Unable to take a screenshot at the moment.\nPossible reasons:\n• Invalid URL\n• Site blocks captures\n• API service unavailable',
                    quoted: m
                });
            }
        }
    }
};