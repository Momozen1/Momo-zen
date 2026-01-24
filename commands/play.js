// ================= commands/play.js =================
import fs from 'fs'
import path from 'path'
import yts from 'yt-search'
import { fileURLToPath } from 'url'
import ytdlp from 'youtube-dl-exec'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  name: 'play',
  description: '🎵 Download a YouTube song as MP3 (KAYA-MD)',
  category: 'Download',
  usage: '.play <song name or YouTube URL>',

  async execute(Kaya, m, args) {
    try {
      if (!args.length)
        return Kaya.sendMessage(
          m.chat,
          { text: '❌ Usage: `.play <song name or YouTube URL>`' },
          { quoted: m }
        )

      const query = args.join(' ')
      let video

      // 🔎 Recherche ou URL directe
      if (/youtube\.com|youtu\.be/.test(query)) {
        video = { url: query }
      } else {
        const search = await yts(query)
        if (!search.videos.length)
          return Kaya.sendMessage(m.chat, { text: '❌ No results found.' }, { quoted: m })
        video = search.videos[0]
      }

      // 📢 Envoi info vidéo
      const infoText = `
╭━━〔 🎵 KAYA-MD MUSIC 〕━━⬣
┃ 🎬 Title    : ${video.title}
┃ ⏱ Duration : ${video.timestamp}
┃ 📍 URL      : ${video.url}
╰━━━━━━━━━━━━━━━━━━⬣
      `.trim()

      await Kaya.sendMessage(
        m.chat,
        { image: { url: video.thumbnail }, caption: infoText },
        { quoted: m }
      )

      // ⬇️ Téléchargement audio avec yt-dlp
      const tempFile = path.join(__dirname, `../tmp/${Date.now()}.mp3`)
      await fs.promises.mkdir(path.dirname(tempFile), { recursive: true })

      await ytdlp(video.url, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: tempFile,
        audioQuality: '0', // meilleure qualité
        quiet: true,
      })

      // 🎧 Envoi audio
      await Kaya.sendMessage(
        m.chat,
        {
          audio: fs.createReadStream(tempFile),
          mimetype: 'audio/mpeg',
          fileName: `${video.title}.mp3`,
          caption: '✅ Downloaded successfully with KAYA-MD 🎵',
        },
        { quoted: m }
      )

      // 🔥 Supprime le fichier temporaire après envoi
      fs.unlink(tempFile, () => {})

    } catch (err) {
      console.error('❌ Play command error:', err)
      await Kaya.sendMessage(
        m.chat,
        { text: '❌ Failed to download the song. Please try again later. (KAYA-MD)' },
        { quoted: m }
      )
    }
  },
}