import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'messageCount.json');

// ==================== Memory ====================
let messageCounts = {};

// Load data on startup
if (fs.existsSync(dataFilePath)) {
    try {
        messageCounts = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    } catch (err) {
        console.error('Error loading messageCount.json:', err);
        messageCounts = {};
    }
}

// Auto-save every 60 seconds
setInterval(() => {
    fs.promises.writeFile(dataFilePath, JSON.stringify(messageCounts, null, 2))
        .catch(err => console.error('Error saving messageCount.json:', err));
}, 60_000);

// ==================== Utils ====================
function incrementMessageCount(groupId, userId) {
    // Stocke le JID complet pour éviter les problèmes de mentions
    if (!messageCounts[groupId]) messageCounts[groupId] = {};
    if (!messageCounts[groupId][userId]) messageCounts[groupId][userId] = 0;
    messageCounts[groupId][userId]++;
}

// ==================== TOP MEMBERS ====================
async function topMembers(sock, chatId) {
    const groupCounts = messageCounts[chatId] || {};
    const sorted = Object.entries(groupCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    if (!sorted.length) {
        return sock.sendMessage(chatId, {
            text: '😴 No messages recorded yet.'
        });
    }

    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata.participants;

    let text = '🏆 *TOP 5 MOST ACTIVE MEMBERS* 🏆\n\n';
    const mentions = [];
    const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️'];

    sorted.forEach(([jid, count], index) => {
        const user = participants.find(
            p => p.id === jid || p.id.split(':')[0] === jid.split('@')[0]
        );

        const name =
            user?.notify ||
            user?.name ||
            jid.split('@')[0];

        text += `${medals[index]} *${name}*\n`;
        text += `↳ 💬 ${count} messages\n\n`;

        mentions.push(jid); // maintenant toutes les mentions sont correctes
    });

    await sock.sendMessage(chatId, {
        text,
        mentions
    });
}

// ==================== COMMAND ====================
export default {
    name: 'topmember',
    alias: ['topmembers', 'leaders'],
    category: 'Groupe',
    description: 'Displays the top 5 most active members',
    group: true,

    async execute(kaya, m) {
        const chatId = m.chat;

        try {
            if (!m.isGroup) {
                return kaya.sendMessage(chatId, {
                    text: '🚫 This command works only in groups.'
                }, { quoted: m });
            }

            // Increment counter for the message author
            incrementMessageCount(chatId, m.sender);

            // Show top members
            await topMembers(kaya, chatId);

        } catch (err) {
            console.error('❌ topMembers error:', err);
            await kaya.sendMessage(chatId, {
                text: '❌ Error displaying top members.'
            }, { quoted: m });
        }
    }
};