import axios from "axios";
import he from "he";

const triviaGames = {}; // Stockage des parties en cours par chatId

// 🔹 Mélange un tableau aléatoirement
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 🔹 Normalise un texte pour comparaison (minuscules + retirer accents)
function normalizeText(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// 🔹 Traduction via Google Translate gratuit
async function translateToFrench(text) {
  try {
    const res = await axios.get(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fr&dt=t&q=${encodeURIComponent(text)}`
    );
    if (res.data?.[0]?.[0]?.[0]) return res.data[0][0][0];
  } catch (err) {
    console.warn("Erreur traduction:", err.message || err);
  }
  return text; // fallback : retourne le texte original
}

export default {
  name: "quiz",
  alias: ["trivia", "question"],
  category: "Fun",
  description: "Démarre une question trivia en français ou répond à une question en cours",

  async execute(kaya, m, args) {
    const chatId = m.chat;

    // ================== RÉPONSE À UNE QUESTION ==================
    if (args.length > 0) {
      if (!triviaGames[chatId]) {
        return kaya.sendMessage(
          chatId,
          { text: "❌ Aucune partie de trivia en cours. Commence une nouvelle partie avec `.quiz`." },
          { quoted: m }
        );
      }

      const game = triviaGames[chatId];
      const answer = args.join(" ").trim();
      let isCorrect = false;

      const index = parseInt(answer, 10);
      if (!isNaN(index) && index >= 1 && index <= game.options.length) {
        isCorrect = normalizeText(game.options[index - 1]) === normalizeText(game.correctAnswer);
      } else {
        isCorrect = normalizeText(answer) === normalizeText(game.correctAnswer);
      }

      if (isCorrect) {
        await kaya.sendMessage(
          chatId,
          { text: `🎉 Correct ! La réponse est : *${game.correctAnswer}*` },
          { quoted: m }
        );
      } else {
        await kaya.sendMessage(
          chatId,
          { text: `❌ Incorrect ! La bonne réponse était : *${game.correctAnswer}*` },
          { quoted: m }
        );
      }

      delete triviaGames[chatId];
      return;
    }

    // ================== PARTIE DÉJÀ EN COURS ==================
    if (triviaGames[chatId]) {
      return kaya.sendMessage(
        chatId,
        { text: "⚠️ Une partie est déjà en cours ! Réponds avec `.quiz <numéro ou texte>`." },
        { quoted: m }
      );
    }

    // ================== NOUVELLE QUESTION ==================
    try {
      const response = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
      const questionData = response.data.results[0];

      const questionText = he.decode(questionData.question);
      const correct = he.decode(questionData.correct_answer);
      const incorrects = questionData.incorrect_answers.map(ans => he.decode(ans));

      // 🔹 Traduction en français
      const questionFr = await translateToFrench(questionText);
      const correctFr = await translateToFrench(correct);
      const incorrectsFr = await Promise.all(incorrects.map(ans => translateToFrench(ans)));
      const options = shuffleArray([...incorrectsFr, correctFr]);

      triviaGames[chatId] = {
        question: questionFr,
        correctAnswer: correctFr,
        options
      };

      const optionsText = options.map((opt, i) => `${i + 1}. ${opt}`).join("\n");
      const category = he.decode(questionData.category);
      const difficulty = questionData.difficulty.charAt(0).toUpperCase() + questionData.difficulty.slice(1);

      await kaya.sendMessage(
        chatId,
        {
          text: `🧠 *Quiz Time !*\n\nQuestion : ${questionFr}\n\nCatégorie : ${category}\nDifficulté : ${difficulty}\n\nOptions :\n${optionsText}\n\nRéponds avec : .quiz <numéro ou texte>`,
          quoted: m.quoted ? m.quoted : m
        }
      );

    } catch (err) {
      console.error("❌ Trivia command error:", err);
      await kaya.sendMessage(
        chatId,
        { text: "❌ Impossible de récupérer une question. Réessaie plus tard." },
        { quoted: m }
      );
    }
  }
};