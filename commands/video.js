import axios from 'axios';
import yts from 'yt-search';

const izumi = { baseURL: "https://izumiiiiiiii.dpdns.org" };
const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
    throw lastError;
}

async function getIzumiVideoByUrl(youtubeUrl) {
    const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=720`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('Izumi API returned no download');
}

async function getOkatsuVideoByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.mp4) return { download: res.data.result.mp4, title: res.data.result.title };
    throw new Error('Okatsu API returned no mp4');
}

export default {
    name: 'video',
    alias: ['ytmp4', 'youtube', 'vid'],
    description: '🎥 Télécharge une vidéo YouTube en MP4',
    category: 'Download',
    usage: '<lien ou mot-clé>',
    async execute(sock, m, args) {
        try {
            const text = m.message?.conversation || m.message?.extendedTextMessage?.text;
            const searchQuery = text.split(' ').slice(1).join(' ').trim();

            if (!searchQuery) {
                return sock.sendMessage(m.chat, { text: '❌ Veuillez fournir un lien YouTube ou un mot-clé de recherche.' }, { quoted: m });
            }

            let videoUrl = '';
            let videoTitle = '';
            let videoThumbnail = '';
            
            if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
                videoUrl = searchQuery;
            } else {
                const { videos } = await yts(searchQuery);
                if (!videos || videos.length === 0) {
                    return sock.sendMessage(m.chat, { text: '❌ Aucune vidéo trouvée !' }, { quoted: m });
                }
                videoUrl = videos[0].url;
                videoTitle = videos[0].title;
                videoThumbnail = videos[0].thumbnail;
            }

            // Envoyer la miniature
            try {
                const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
                const thumb = videoThumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : undefined);
                const captionTitle = videoTitle || searchQuery;
                if (thumb) {
                    await sock.sendMessage(m.chat, {
                        image: { url: thumb },
                        caption: `*${captionTitle}*\n⏳ Téléchargement en cours...`
                    }, { quoted: m });
                }
            } catch (e) { console.error('[VIDEO] Thumb error:', e?.message || e); }

            // Vérifier lien YouTube
            const urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
            if (!urls) {
                return sock.sendMessage(m.chat, { text: '❌ Lien YouTube invalide !' }, { quoted: m });
            }

            // Récupérer la vidéo
            let videoData;
            try { videoData = await getIzumiVideoByUrl(videoUrl); }
            catch { videoData = await getOkatsuVideoByUrl(videoUrl); }

            // Envoyer la vidéo
            await sock.sendMessage(m.chat, {
                video: { url: videoData.download },
                mimetype: 'video/mp4',
                fileName: `${videoData.title || videoTitle || 'video'}.mp4`,
                caption: `*${videoData.title || videoTitle || 'Video'}*\n\n> *_Téléchargée par KAYA-MD_*`
            }, { quoted: m });

        } catch (error) {
            console.error('[VIDEO] Command error:', error?.message || error);
            await sock.sendMessage(m.chat, { text: '❌ Échec du téléchargement : ' + (error?.message || 'Erreur inconnue') }, { quoted: m });
        }
    }
};