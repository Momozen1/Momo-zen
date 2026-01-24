import axios from "axios";
import { load } from "cheerio";

export default {
  name: "img",
  alias: ["image"],
  category: "Download",
  description: "Télécharge une image depuis le web",
  usage: ".img <mot-clé>",
  run: async (kaya, m, args) => {
    if (!args[0]) {
      return kaya.sendMessage(
        m.chat,
        { text: "❌ Indique un mot-clé, ex: .img naruto" },
        { quoted: m }
      );
    }

    const query = args.join(" ");
    try {
      // 🔹 Rechercher sur Unsplash
      const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
      const res = await axios.get(url);
      const $ = load(res.data);

      // 🔹 Prendre la première image
      const imgUrl = $('img[src^="https://images.unsplash.com"]').first().attr("src");
      if (!imgUrl) {
        return kaya.sendMessage(
          m.chat,
          { text: "❌ Aucune image trouvée." },
          { quoted: m }
        );
      }

      // 🔹 Envoyer l'image
      await kaya.sendMessage(
        m.chat,
        { image: { url: imgUrl }, caption: `Image trouvée pour : ${query}` },
        { quoted: m }
      );
    } catch (err) {
      console.error(err);
      return kaya.sendMessage(
        m.chat,
        { text: "❌ Impossible de récupérer l'image." },
        { quoted: m }
      );
    }
  },
};