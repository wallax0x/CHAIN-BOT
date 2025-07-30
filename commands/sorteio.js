const delay = require('../utils/delay'); // Para o delay no sorteio

module.exports = async (sock, m, jid, args, PREFIX) => { // PREFIX para mensagens de uso
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const raffleName = args.join(' ').trim(); // Nome do sorteio
        if (!raffleName) {
            return sock.sendMessage(jid, { text: `❌ Por favor, dê um nome ao sorteio. Ex: *${PREFIX}sorteio Uma Viagem Incrível!*` }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `🎉 *SORTEIO INICIADO!* 🎉\n\nEstamos sorteando: *${raffleName}*\n\n_Escolhendo um(a) sortudo(a) no grupo..._`, quoted: m });

        // Pequeno delay para gerar expectativa
        await delay(3000); // Espera 3 segundos

        // Obtém a lista de participantes do grupo
        const metadata = await sock.groupMetadata(jid);
        const participants = metadata.participants;

        const botId = sock.user.id.includes('@s.whatsapp.net') ? sock.user.id : sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Filtra participantes válidos (exclui o bot e participantes inválidos se houver)
        const eligibleParticipants = participants.filter(p => p.id !== botId && p.id.includes('@s.whatsapp.net'));

        if (eligibleParticipants.length === 0) {
            return sock.sendMessage(jid, { text: '⚠️ Não há participantes elegíveis para o sorteio (excluindo o bot).', quoted: m });
        }

        // Escolhe um participante aleatoriamente
        const winner = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)];
        const winnerMention = `@${winner.id.split('@')[0]}`;

        // Mensagem de parabéns
        const congratsMessage = 
        `✨ *E O(A) GRANDE VENCEDOR(A) É...* ✨\n\n` +
        `Parabéns, ${winnerMention}!\n` +
        `Você é o(a) sortudo(a) que ganhou o sorteio de *${raffleName}*! 🥳\n\n` +
        `_Entre em contato com o administrador para resgatar seu prêmio!_`;

        await sock.sendMessage(jid, { text: congratsMessage, mentions: [winner.id] }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando sorteio:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao realizar o sorteio. Tente novamente mais tarde.', quoted: m });
    }
};