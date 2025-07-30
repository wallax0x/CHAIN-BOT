const { gameStates } = require('../data/games.js');
const { printBoard, startInactivityTimer } = require('../utils/gameUtils.js');

module.exports = {
    command: async (sock, m, jid) => {
        // Adicionamos um try...catch para mais segurança
        try {
            console.log(`[ACT-DEBUG] Comando .act recebido no grupo ${jid}.`); // LOG 1

            const gameState = gameStates[jid];
            const senderId = m.key.participant || m.key.remoteJid;

            // LOG 2: Vamos ver o que está no estado do jogo
            console.log('[ACT-DEBUG] Estado atual do jogo:', JSON.stringify(gameState, null, 2));
            console.log(`[ACT-DEBUG] Quem enviou o .act: ${senderId}`);

            // Validação 1: Existe um convite neste grupo?
            if (!gameState || !gameState.invite) {
                console.log('[ACT-DEBUG] FALHA: Não há convite de jogo pendente (gameState.invite é falso ou inexistente).');
                return sock.sendMessage(jid, { text: 'ℹ️ Não há nenhum convite de jogo pendente neste grupo.' }, { quoted: m });
            }

            // LOG 3: Vamos verificar o ID do jogador desafiado
            console.log(`[ACT-DEBUG] ID do jogador que deveria aceitar: ${gameState.player2.id}`);

            // Validação 2: A pessoa que digitou .act é a que foi desafiada?
            if (senderId !== gameState.player2.id) {
                console.log(`[ACT-DEBUG] FALHA: O remetente (${senderId}) não é o jogador desafiado (${gameState.player2.id}).`);
                return sock.sendMessage(jid, { text: `❌ Este convite é para @${gameState.player2.id.split('@')[0]}, não para você.`, mentions: [gameState.player2.id] }, { quoted: m });
            }

            console.log('[ACT-DEBUG] SUCESSO: Verificações passaram! Iniciando o jogo...');

            // Inicia o jogo
            gameState.invite = false;
            gameState.isActive = true;
            gameState.board = Array(9).fill(null);
            gameState.currentPlayer = gameState.player1;
            gameState.player2.name = m.pushName || 'Jogador 2';

            const text = `🔥 O desafio foi aceito! O jogo começou!\n\n` +
                         `${gameState.player1.name} é ❌\n` +
                         `${gameState.player2.name} é ⭕\n\n` +
                         `É a vez de @${gameState.currentPlayer.id.split('@')[0]} (❌).\n` +
                         `Envie um número de 1 a 9 para fazer sua jogada.`;
            
            await sock.sendMessage(jid, { text: text + '\n' + printBoard(gameState.board), mentions: [gameState.currentPlayer.id] });

            // Inicia o timer de inatividade para a primeira jogada
            startInactivityTimer(sock, jid);

        } catch (error) {
            console.error('[ERRO FATAL NO COMANDO .act]', error);
            await sock.sendMessage(jid, { text: '❌ Ocorreu um erro crítico ao tentar aceitar o jogo.' });
        }
    }
};