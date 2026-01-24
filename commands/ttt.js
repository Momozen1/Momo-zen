// ==================== commands/ttt.js ====================
import TicTacToe from '../lib/tictactoe.js';

// 🔹 Stockage des parties en mémoire
const games = {};

export default {
  name: 'ttt',
  description: '🎮 Jouer au TicTacToe avec quelqu’un',
  category: 'Fun',
  ownerOnly: false,

  run: async (kaya, m, args) => {
    const chatId = m.chat;
    const senderId = m.sender;
    const text = args.join(' ');

    try {
      // 🔹 Vérifie si le joueur est déjà dans une partie
      const existingGame = Object.values(games).find(room =>
        room.id.startsWith('tictactoe') &&
        [room.game.playerX, room.game.playerO].includes(senderId)
      );

      if (existingGame && !/^(surrender|give up)$/i.test(text)) {
        return kaya.sendMessage(chatId, { text: '❌ Tu es déjà dans une partie. Tape *surrender* pour abandonner.' }, { quoted: m });
      }

      // 🔹 Si c’est un surrender ou coup, on gère le move
      if (existingGame) {
        await handleMove(kaya, m, existingGame, text, senderId);
        return;
      }

      // 🔹 Cherche une room en attente
      let room = Object.values(games).find(room =>
        room.state === 'WAITING' && (text ? room.name === text : true)
      );

      if (room) {
        // Rejoindre la room
        room.o = chatId;
        room.game.playerO = senderId;
        room.state = 'PLAYING';

        await sendBoard(kaya, room, `🎮 *TicTacToe Game Started!*\n\nTour de @${room.game.currentTurn.split('@')[0]}...`);

      } else {
        // Créer nouvelle room
        room = {
          id: 'tictactoe-' + Date.now(),
          x: chatId,
          o: '',
          game: new TicTacToe(senderId, 'o'),
          state: 'WAITING'
        };
        if (text) room.name = text;

        await kaya.sendMessage(chatId, { text: `⏳ En attente d’un adversaire...\nTape *.ttt ${text || ''}* pour rejoindre !` });

        games[room.id] = room;
      }

    } catch (err) {
      console.error('❌ Erreur TicTacToe :', err);
      await kaya.sendMessage(chatId, { text: '❌ Impossible de lancer la partie. Réessaie.' }, { quoted: m });
    }
  }
};

// 🔹 Fonction pour gérer les coups
async function handleMove(kaya, m, room, text, senderId) {
  const chatId = m.chat;
  const isSurrender = /^(surrender|give up)$/i.test(text);

  if (!isSurrender && !/^[1-9]$/.test(text)) return;

  if (senderId !== room.game.currentTurn && !isSurrender) {
    return kaya.sendMessage(chatId, { text: '❌ Ce n’est pas ton tour !' }, { quoted: m });
  }

  let ok = isSurrender ? true : room.game.turn(senderId === room.game.playerO, parseInt(text) - 1);
  if (!ok) return kaya.sendMessage(chatId, { text: '❌ Coup invalide ! La case est déjà occupée.' }, { quoted: m });

  let winner = room.game.winner;
  let isTie = room.game.turns === 9;

  if (isSurrender) {
    winner = senderId === room.game.playerX ? room.game.playerO : room.game.playerX;
    await kaya.sendMessage(chatId, {
      text: `🏳️ @${senderId.split('@')[0]} a abandonné ! @${winner.split('@')[0]} gagne !`,
      mentions: [senderId, winner]
    }, { quoted: m });
    delete games[room.id];
    return;
  }

  await sendBoard(kaya, room, null, winner, isTie);
  if (winner || isTie) delete games[room.id];
}

// 🔹 Fonction pour afficher le plateau
async function sendBoard(kaya, room, title = null, winner = null, isTie = false) {
  const arr = room.game.render().map(v => ({
    'X': '❎', 'O': '⭕',
    '1': '1️⃣', '2': '2️⃣', '3': '3️⃣',
    '4': '4️⃣', '5': '5️⃣', '6': '6️⃣',
    '7': '7️⃣', '8': '8️⃣', '9': '9️⃣'
  }[v]));

  let gameStatus;
  if (winner) gameStatus = `🎉 @${winner.split('@')[0]} gagne la partie !`;
  else if (isTie) gameStatus = `🤝 Match nul !`;
  else gameStatus = `🎲 Tour : @${room.game.currentTurn.split('@')[0]} (${room.game.currentTurn === room.game.playerX ? '❎' : '⭕'})`;

  const str = `
${title || '🎮 *TicTacToe*'}

${gameStatus}

${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

▢ Joueur ❎: @${room.game.playerX.split('@')[0]}
▢ Joueur ⭕: @${room.game.playerO.split('@')[0]}

${!winner && !isTie ? '• Tape un chiffre (1-9) pour jouer\n• Tape *surrender* pour abandonner' : ''}
`;

  const mentions = [room.game.playerX, room.game.playerO, ...(winner ? [winner] : [room.game.currentTurn])];

  await kaya.sendMessage(room.x, { text: str, mentions });
  if (room.x !== room.o && room.o) await kaya.sendMessage(room.o, { text: str, mentions });
}