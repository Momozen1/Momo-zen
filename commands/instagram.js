import { igdl } from 'ruhend-scraper';
import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'insta',
  alias: ['instagram', 'ig'],
  description: 'Download photos and videos from Instagram',
  category: 'Download',

  async run(kaya, m, args) {
    try {
      const text = args.join(' ').trim() || m.message?.conversation;

      if (!text) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ Please provide a valid Instagram link (post, reel, or IGTV).', contextInfo },
          { quoted: m }
        );
      }

      // Check if it's a valid Instagram link
      if (!/https?:\/\/(www\.)?(instagram\.com|instagr\.am)\//.test(text)) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ This is not a valid Instagram link.', contextInfo },
          { quoted: m }
        );
      }

      // Temporary message
      await kaya.sendMessage(
        m.chat,
        { text: '🔄 Fetching Instagram media... Please wait.', contextInfo },
        { quoted: m }
      );

      // Retrieve media
      const downloadData = await igdl(text);
      if (!downloadData?.data || downloadData.data.length === 0) {
        return kaya.sendMessage(
          m.chat,
          { text: '❌ No media found. The post might be private or the link is invalid.', contextInfo },
          { quoted: m }
        );
      }

      // Limit to 10 media items
      const mediaData = downloadData.data.slice(0, 10);

      for (const media of mediaData) {
        const mediaUrl = media.url;
        const isVideo = media.type === 'video' || /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl);

        if (isVideo) {
          await kaya.sendMessage(
            m.chat,
            { video: { url: mediaUrl }, mimetype: 'video/mp4', caption: '✅ Instagram media downloaded!', contextInfo },
            { quoted: m }
          );
        } else {
          await kaya.sendMessage(
            m.chat,
            { image: { url: mediaUrl }, caption: '✅ Instagram media downloaded!', contextInfo },
            { quoted: m }
          );
        }

        // Pause between sending to avoid blocks
        await new Promise(res => setTimeout(res, 1000));
      }

    } catch (err) {
      console.error('❌ Instagram command error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Unable to fetch Instagram media. Please try again later.', contextInfo },
        { quoted: m }
      );
    }
  }
};