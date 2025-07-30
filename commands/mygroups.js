const { OWNER_JID } = require('../config'); // Importa o JID do dono

module.exports = async (sock, m, jid, args, senderId) => { // 'senderId' será passado pelo handleCommand
    try {
        // 1. Verifica se quem está usando o comando é o dono do bot
        if (senderId !== OWNER_JID) {
            return sock.sendMessage(jid, { text: '❌ Apenas o dono do bot pode usar este comando.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '🔎 Obtendo lista de grupos, aguarde...' }, { quoted: m });

        // Obtém a lista de chats do bot
        const chats = await sock.groupFetchAllParticipating();
        const groups = Object.values(chats).filter(chat => chat.id.endsWith('@g.us')); // Filtra apenas grupos

        if (groups.length === 0) {
            return sock.sendMessage(jid, { text: '⚠️ Eu não estou em nenhum grupo no momento.', quoted: m });
        }

        let groupListMessage = '*📚 Grupos que eu participo:*\n\n';
        groups.forEach(group => {
            groupListMessage += `*Nome:* ${group.subject}\n`;
            groupListMessage += `*ID:* ${group.id}\n`;
            groupListMessage += `*Membros:* ${group.participants.length}\n`;
            groupListMessage += `---------------------------\n`;
        });

        await sock.sendMessage(jid, { text: groupListMessage }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando mygroups:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao obter a lista de grupos. Tente novamente mais tarde.', quoted: m });
    }
};