// Importa o estado dos jogos para que as funções do timer possam acessá-lo
const { gameStates } = require('../data/games.js');

const EMOJIS = {
    'X': '❌',
    'O': '⭕',
    empty: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
};

/**
 * Desenha um tabuleiro de Jogo da Velha (versão corrigida e simplificada).
 */
function printBoard(board) {
    // Função auxiliar para pegar o caractere da célula de forma segura
    const getCell = (index) => {
        const cellValue = board[index];
        // Se a célula tiver 'X' ou 'O', retorna o emoji correspondente
        if (cellValue === 'X' || cellValue === 'O') {
            return EMOJIS[cellValue];
        }
        // Se a célula estiver vazia (null), retorna o emoji do número
        return EMOJIS.empty[index];
    };

    const boardRows = [
        "     *🎲 JOGO DA VELHA 🎲*",
        "```",
        `   ${getCell(0)} │ ${getCell(1)} │ ${getCell(2)}`,
        `  ───┼───┼───`,
        `   ${getCell(3)} │ ${getCell(4)} │ ${getCell(5)}`,
        `  ───┼───┼───`,
        `   ${getCell(6)} │ ${getCell(7)} │ ${getCell(8)}`,
        "```"
    ];

    return boardRows.join('\n');
}

/**
 * Verifica se há um vencedor ou se o jogo empatou (versão corrigida).
 */
function checkWinner(board) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
        [0, 4, 8], [2, 4, 6]  // Diagonais
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        // Lógica simplificada: Apenas verifica se os valores nas posições são iguais e não nulos
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Retorna 'X' ou 'O'
        }
    }

    // Checagem de empate corrigida: verifica se todas as células estão preenchidas
    if (board.every(cell => cell !== null)) {
        return 'draw'; // Empate
    }

    return null; // Jogo continua
}


// --- LÓGICA DE TIMER DE INATIVIDADE (sem alterações) ---
const INACTIVITY_TIMEOUT_MINUTES = 5;

function startInactivityTimer(sock, jid) {
    const gameState = gameStates[jid];
    if (!gameState) return;
    if (gameState.inactivityTimer) clearTimeout(gameState.inactivityTimer);

    gameState.inactivityTimer = setTimeout(async () => {
        const currentState = gameStates[jid];
        if (currentState && currentState.isActive) {
            const playerWhoseTurnItWas = currentState.currentPlayer;
            delete gameStates[jid];
            const timeoutMessage = `⏰ O jogo da velha foi cancelado por inatividade!\n\n` +
                                 `O jogador @${playerWhoseTurnItWas.id.split('@')[0]} demorou mais de ${INACTIVITY_TIMEOUT_MINUTES} minutos para jogar.`;
            await sock.sendMessage(jid, { text: timeoutMessage, mentions: [playerWhoseTurnItWas.id] });
        }
    }, INACTIVITY_TIMEOUT_MINUTES * 60 * 1000);
}

function clearInactivityTimer(jid) {
    const gameState = gameStates[jid];
    if (gameState && gameState.inactivityTimer) {
        clearTimeout(gameState.inactivityTimer);
        delete gameState.inactivityTimer;
    }
}


// Exporta todas as funções para serem usadas em outros arquivos
module.exports = { 
    printBoard, 
    checkWinner,
    startInactivityTimer,
    clearInactivityTimer
};