import fetch from 'node-fetch';

export const lyricsCommand = {
  name: 'lyrics',
  alias: ['lyrics', 'paroles'],
  category: 'Download',
  description: 'Fetches the lyrics of a song',
  usage: '.lyrics <song name>',
  
  run: async (sock, m, args) => {
    const chatId = m.chat;
    const songTitle = args.join(' ');

    if (!songTitle) {
      await sock.sendMessage(chatId, {
        text: '🔍 Please provide the song name to get the lyrics!\nUsage: *.lyrics <song name>*'
      }, { quoted: m });
      return;
    }

    try {
      const apiUrl = `https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(songTitle)}`;
      const res = await fetch(apiUrl);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      const data = await res.json();
      const lyrics = data?.result?.lyrics;

      if (!lyrics) {
        await sock.sendMessage(chatId, {
          text: `❌ Sorry, no lyrics found for "${songTitle}".`
        }, { quoted: m });
        return;
      }

      // Limit message to 4096 characters for WhatsApp
      const maxChars = 4096;
      const output = lyrics.length > maxChars ? lyrics.slice(0, maxChars - 3) + '...' : lyrics;

      await sock.sendMessage(chatId, {
        text: `🎵 *Lyrics of "${songTitle}"* 🎵\n\n${output}`,
        quoted: m
      });

    } catch (error) {
      console.error('Lyrics command error:', error);
      await sock.sendMessage(chatId, {
        text: `❌ An error occurred while fetching the lyrics for "${songTitle}".`
      }, { quoted: m });
    }
  }
};