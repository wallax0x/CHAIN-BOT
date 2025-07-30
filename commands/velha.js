const { gameStates } = require('../data/games.js');

const TIMEOUT_SECONDS = 60; // Tempo em segundos para aceitar

module.exports = {
    command: async (sock, m, jid) => {
        if (gameStates[jid]?.isActive || gameStates[jid]?.invite) {
            return sock.sendMessage(jid, { text: '❌ Já existe um jogo ou convite pendente neste grupo.' }, { quoted: m });
        }
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedJid) {
            return sock.sendMessage(jid, { text: '❌ Você precisa marcar um oponente! Ex: `.velha @oponente`' }, { quoted: m });
        }
        const player1Id = m.key.participant || m.key.remoteJid;
        if (player1Id === mentionedJid) {
            return sock.sendMessage(jid, { text: '❌ Você não pode desafiar a si mesmo!' }, { quoted: m });
        }

        const player1 = { id: player1Id, name: m.pushName || 'Jogador 1', symbol: 'X' };
        const player2 = { id: mentionedJid, name: '', symbol: 'O' };

        gameStates[jid] = {
            invite: true,
            player1: player1,
            player2: player2
        };

        const text = `⚔️ @${player1.id.split('@')[0]} desafiou @${player2.id.split('@')[0]} para uma partida de Jogo da Velha!\n\n` +
                     `@${player2.id.split('@')[0]}, você tem ${TIMEOUT_SECONDS} segundos para aceitar com **.act**!`;

        await sock.sendMessage(jid, { text, mentions: [player1.id, player2.id] });
        
        // --- NOVO: LÓGICA DE TIMEOUT ---
        setTimeout(async () => {
            const currentState = gameStates[jid];
            // Verifica se o convite ainda existe e não foi aceito
            if (currentState && currentState.invite && currentState.player2.id === player2.id) {
                console.log(`[VELHA-TIMEOUT] Convite para ${player2.id} no grupo ${jid} expirou.`);
                delete gameStates[jid]; // Remove o convite
                const timeoutText = `⏰ O tempo acabou! O convite de @${player1.id.split('@')[0]} para @${player2.id.split('@')[0]} foi cancelado por inatividade.`;
                await sock.sendMessage(jid, { text: timeoutText, mentions: [player1.id, player2.id] });
            }
        }, TIMEOUT_SECONDS * 1000); // Converte segundos para milissegundos
    }
};