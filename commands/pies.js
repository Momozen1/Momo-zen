// ==================== commands/pies.js ====================
import fetch from "node-fetch";

const BASE = 'https://shizoapi.onrender.com/api/pies';
const VALID_COUNTRIES = [
  'china', 'japan', 'korea', 'indonesia', 'hijab',
  'thailand', 'vietnam', 'malaysia', 'philippines', 'singapore',
  'india', 'pakistan', 'bangladesh', 'nepal', 'sri_lanka',
  'myanmar', 'laos', 'cambodia', 'mongolia', 'taiwan',
  'hongkong', 'macau', 'north_korea', 'south_korea', 'maldives',
  'bhutan', 'brunei', 'timor_leste', 'afghanistan', 'turkey',
  'iraq', 'iran', 'saudi_arabia', 'uae', 'qatar',
  'bahrain', 'oman', 'kuwait', 'yemen', 'syria',
  'lebanon', 'jordan', 'palestine', 'egypt', 'morocco'
];

// 🔹 Fonction pour récupérer l’image en buffer
async function fetchPiesImageBuffer(country) {
  const url = `${BASE}/${country}?apikey=shizo`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('image')) throw new Error('API did not return an image');
  return res.buffer();
}

// 🔹 Fonction pour formater la liste des pays lisiblement
function formatCountries(countries, perLine = 10) {
  let lines = [];
  for (let i = 0; i < countries.length; i += perLine) {
    const line = countries.slice(i, i + perLine).map(c => {
      return c.charAt(0).toUpperCase() + c.slice(1); // première lettre majuscule
    }).join(', ');
    lines.push(line);
  }
  return lines.join('\n');
}

export default {
  name: "pies",
  alias: ["pie"],
  description: "🖼️ Envoie une image de pies selon le pays choisi",
  category: "Image",
  usage: ".pies <country> (ex: .pies japan)",
  
  async execute(kaya, m, args) {
    const chatId = m.chat;
    const sub = (args && args[0] ? args[0] : '').toLowerCase();

    // ❌ Vérification de l’argument
    if (!sub) {
      return kaya.sendMessage(chatId, {
        text: `🌍 *Usage de la commande PIES*\n\n` +
              `Syntaxe: .pies <country>\n` +
              `Countries disponibles (${VALID_COUNTRIES.length}):\n` +
              `${formatCountries(VALID_COUNTRIES)}`
      }, { quoted: m });
    }

    // ❌ Country invalide
    if (!VALID_COUNTRIES.includes(sub)) {
      return kaya.sendMessage(chatId, {
        text: `❌ *Pays invalide:* ${sub}\nEssayez l’un de ces pays:\n${formatCountries(VALID_COUNTRIES)}`
      }, { quoted: m });
    }

    try {
      // 🔹 Récupération de l’image
      const imageBuffer = await fetchPiesImageBuffer(sub);

      // 🔹 Envoi de l’image
      await kaya.sendMessage(chatId, {
        image: imageBuffer,
        caption: `🖼️ Voici une image de pies pour: *${sub.toUpperCase()}*`,
      }, { quoted: m });

    } catch (err) {
      console.error(`❌ Erreur dans la commande pies (${sub}):`, err);
      await kaya.sendMessage(chatId, {
        text: '❌ Impossible de récupérer l’image. Réessayez plus tard !'
      }, { quoted: m });
    }
  }
};

export { VALID_COUNTRIES };