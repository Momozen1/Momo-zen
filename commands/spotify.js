// ==================== commands/spotify.js ====================
import axios from 'axios';

export default {
    name: 'spotify',
    alias: ['sp', 'music'],
    category: 'Download',
    description: 'Télécharge une chanson depuis Spotify (audio + info)',
    usage: '.spotify <titre/artiste/mots-clés>',
    async execute(sock, m, args) {
        const chatId = m.chat;

        try {
            // Récupérer le texte saisi
            const rawText = m.message?.conversation?.trim() ||
                            m.message?.extendedTextMessage?.text?.trim() ||
                            m.message?.imageMessage?.caption?.trim() ||
                            m.message?.videoMessage?.caption?.trim() ||
                            '';

            const usedCmd = (rawText || '').split(/\s+/)[0] || '.spotify';
            const query = rawText.slice(usedCmd.length).trim();

            if (!query) {
                return await sock.sendMessage(chatId, {
                    text: 'Usage: .spotify <titre/artiste/mots-clés>\nExemple: .spotify con calma'
                }, { quoted: m });
            }

            // Appel API
            const apiUrl = `https://okatsu-rolezapiiz.vercel.app/search/spotify?q=${encodeURIComponent(query)}`;
            const { data } = await axios.get(apiUrl, { timeout: 20000, headers: { 'user-agent': 'Mozilla/5.0' } });

            if (!data?.status || !data?.result) {
                throw new Error('Aucun résultat trouvé pour cette requête.');
            }

            const track = data.result;
            const audioUrl = track.audio;

            if (!audioUrl) {
                return await sock.sendMessage(chatId, {
                    text: '❌ Aucun audio téléchargeable trouvé pour cette requête.'
                }, { quoted: m });
            }

            // Construire la légende
            const caption = `🎵 Titre: ${track.title || track.name || 'Unknown'}\n` +
                            `👤 Artiste: ${track.artist || 'Unknown'}\n` +
                            `⏱ Durée: ${track.duration || 'N/A'}\n` +
                            `🔗 Lien: ${track.url || 'N/A'}`.trim();

            // Envoyer la cover si disponible
            if (track.thumbnails) {
                await sock.sendMessage(chatId, { image: { url: track.thumbnails }, caption }, { quoted: m });
            } else {
                await sock.sendMessage(chatId, { text: caption }, { quoted: m });
            }

            // Envoyer le fichier audio
            await sock.sendMessage(chatId, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: `${(track.title || track.name || 'track').replace(/[\\/:*?"<>|]/g, '')}.mp3`
            }, { quoted: m });

        } catch (error) {
            console.error('[SPOTIFY] error:', error?.message || error);
            await sock.sendMessage(chatId, {
                text: '❌ Impossible de récupérer l’audio Spotify. Essaie une autre requête plus tard.'
            }, { quoted: m });
        }
    }
};