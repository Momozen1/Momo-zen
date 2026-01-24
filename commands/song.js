// ================= commands/song.js =================
import fs from 'fs'
import path from 'path'
import yts from 'yt-search'
import ytdlp from 'youtube-dl-exec' // Assurez-vous d'avoir installé youtube-dl-exec

export default {
  name: 'song',
  description: 'Download a song from YouTube',
  category: 'Download',

  async execute(Kaya, m, args) {
    try {
      if (!args.length)
        return Kaya.sendMessage(
          m.chat,
          { text: '❌ Usage: `.song song name` or YouTube link' },
          { quoted: m }
        )

      const query = args.join(' ')
      let video

      // 🔎 Search or direct link
      if (query.includes('youtube.com') || query.includes('youtu.be')) {
        video = { url: query, title: query, thumbnail: 'https://i.ytimg.com/vi/default.jpg', timestamp: 'N/A' }
      } else {
        const search = await yts(query)
        if (!search.videos.length)
          return Kaya.sendMessage(m.chat, { text: '❌ No results found.' }, { quoted: m })
        video = search.videos[0]
      }

      // 📢 Send video info first
      await Kaya.sendMessage(
        m.chat,
        {
          image: { url: video.thumbnail },
          caption: `🎵 *${video.title}*\n⏱ Duration: ${video.timestamp || 'N/A'}`,
        },
        { quoted: m }
      )

      // ⬇️ Download audio using yt-dlp
      const tmpDir = './tmp'
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

      const filename = `song-${Date.now()}.mp3`
      const filepath = path.join(tmpDir, filename)

      await ytdlp(video.url, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: filepath,
        noCheckCertificates: true,
        quiet: true
      })

      // 🎧 Send audio
      await Kaya.sendMessage(
        m.chat,
        {
          audio: { url: filepath },
          mimetype: 'audio/mpeg',
          fileName: `${video.title || 'song'}.mp3`,
        },
        { quoted: m }
      )

      // ✅ Delete temp file
      fs.unlink(filepath, (err) => {
        if (err) console.error('❌ Failed to delete temp audio:', err)
      })

    } catch (err) {
      console.error('❌ SONG ERROR:', err)
      await Kaya.sendMessage(
        m.chat,
        { text: '❌ Error occurred during the download. Check your YouTube link or try again later.' },
        { quoted: m }
      )
    }
  },
}