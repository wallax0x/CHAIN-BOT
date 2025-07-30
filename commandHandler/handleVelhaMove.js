const { gameStates } = require('../data/games.js');
const { printBoard, checkWinner, clearInactivityTimer } = require('../utils/gameUtils.js');
const { addXp } = require('../utils/xp_manager.js'); 
const { addCoins } = require('../utils/coin_manager.js'); // Importa a função que acabamos de adicionar

// --- Constantes para as recompensas ---
const WIN_XP = 50;
const WIN_COINS = 15; // Moedas para o vencedor
const DRAW_XP = 25;
const PARTICIPATION_XP = 10; // XP de consolação

async function handleVelhaMove(sock, m, jid, body) {
    try {
        const gameState = gameStates[jid];
        if (!gameState || !gameState.isActive) return;
        const senderId = m.key.participant || m.key.remoteJid;
        if (senderId !== gameState.currentPlayer.id) return;

        const move = parseInt(body);
        const boardIndex = move - 1;
        if (gameState.board[boardIndex] !== null) {
            return sock.sendMessage(jid, { text: '❌ Este espaço já está ocupado! Escolha outro.' }, { quoted: m });
        }

        gameState.board[boardIndex] = gameState.currentPlayer.symbol;
        const winnerSymbol = checkWinner(gameState.board);
        
        if (winnerSymbol) {
            clearInactivityTimer(jid); 

            const winner = gameState.currentPlayer;
            const loser = gameState.currentPlayer.id === gameState.player1.id ? gameState.player2 : gameState.player1;
            let finalMessage;

            if (winnerSymbol === 'draw') {
                await addXp(gameState.player1.id, jid, DRAW_XP);
                await addXp(gameState.player2.id, jid, DRAW_XP);
                finalMessage = `👵 Deu velha! O jogo empatou!\n\nAmbos os jogadores ganharam *${DRAW_XP} XP*!`;

            } else {
                await addXp(winner.id, jid, WIN_XP);
                await addCoins(winner.id, WIN_COINS); // <-- USA A FUNÇÃO PARA DAR MOEDAS
                await addXp(loser.id, jid, PARTICIPATION_XP);

                finalMessage = `🏆 Fim de jogo! O vencedor é @${winner.id.split('@')[0]} (${winner.symbol})!\n\n` +
                               `*Recompensas:*\n` +
                               `- Vencedor: *${WIN_XP} XP* 🏅 e *${WIN_COINS} moedas* 💰\n` +
                               `- Participante: *${PARTICIPATION_XP} XP*`;
            }

            await sock.sendMessage(jid, { text: printBoard(gameState.board) + '\n' + finalMessage, mentions: [winner.id, loser.id] });
            delete gameStates[jid];
            return;
        }

        const { startInactivityTimer } = require('../utils/gameUtils.js');
        gameState.currentPlayer = gameState.currentPlayer.id === gameState.player1.id ? gameState.player2 : gameState.player1;
        const turnText = `É a vez de @${gameState.currentPlayer.id.split('@')[0]} (${gameState.currentPlayer.symbol}).`;
        await sock.sendMessage(jid, { text: turnText + '\n' + printBoard(gameState.board), mentions: [gameState.currentPlayer.id] });
        startInactivityTimer(sock, jid);

    } catch (error) {
        console.error('[ERRO em handleVelhaMove]', error);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro interno ao processar sua jogada.' });
    }
}

module.exports = { handleVelhaMove };