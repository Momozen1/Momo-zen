import fetch from 'node-fetch';

export default {
  name: 'traduc',
  alias: ['trt', 'tr'],
  category: 'AI',
  description: 'Traduit un message en une langue spécifique',
  usage: '<reply à un message ou texte> <langue>',

  async execute(kaya, m, args) {
    const chatId = m.chat;

    try {
      // ==================== FONCTION UTILE ====================
      // Récupère le texte du message reply ou caption d’un média
      function getQuotedText(m) {
        if (!m?.quoted?.message) return '';
        const msg = m.quoted.message;

        // Texte classique dans RC6
        if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;

        // Caption des médias
        if (msg.imageMessage?.caption) return msg.imageMessage.caption;
        if (msg.videoMessage?.caption) return msg.videoMessage.caption;
        if (msg.documentMessage?.caption) return msg.documentMessage.caption;

        return '';
      }

      // ==================== RÉCUP TEXTE ET LANG ====================
      let textToTranslate = '';
      let lang = '';

      // 1️⃣ Reply à un message
      if (m.quoted) {
        textToTranslate = getQuotedText(m).trim();
        lang = args[0]?.toLowerCase(); // langue après la commande

        if (!lang) {
          return kaya.sendMessage(chatId, { 
            text: '❌ Indique la langue pour la traduction.\nExemple: .traduc fr' 
          }, { quoted: m });
        }
      } 
      // 2️⃣ Sans reply → arguments + langue
      else {
        if (args.length < 2) {
          return kaya.sendMessage(chatId, {
            text: `🌍 *COMMANDE TRADUCTION (.traduc)*

Usage:
1️⃣ Reply à un message:
.traduc fr

2️⃣ Sans reply:
.traduc hello fr

Exemples:
.traduc hello fr
.trt bonjour en

Langues supportées:
fr | en | es | de | it | pt
ru | ja | ko | zh | ar | hi`,
          }, { quoted: m });
        }

        lang = args.pop().toLowerCase();
        textToTranslate = args.join(' ');
      }

      if (!textToTranslate) {
        return kaya.sendMessage(chatId, { text: '❌ Aucun texte à traduire.' }, { quoted: m });
      }

      // ==================== TRADUCTION ====================
      let translatedText = '';

      // 🌐 Google Translate API
      try {
        const res = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`
        );
        const data = await res.json();
        if (data?.[0]?.[0]?.[0]) translatedText = data[0][0][0];
      } catch {}

      // 🔄 Fallback MyMemory
      if (!translatedText) {
        try {
          const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`
          );
          const data = await res.json();
          if (data?.responseData?.translatedText) translatedText = data.responseData.translatedText;
        } catch {}
      }

      if (!translatedText) {
        throw new Error('Translation failed');
      }

      // ==================== ENVOI ====================
      await kaya.sendMessage(chatId, { text: translatedText }, { quoted: m });

    } catch (err) {
      console.error('❌ Traduc command error:', err);
      await kaya.sendMessage(chatId, { text: '❌ Impossible de traduire le texte. Réessaie plus tard.', quoted: m });
    }
  }
};