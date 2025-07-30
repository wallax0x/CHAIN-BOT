const { PREFIX } = require('../config'); // Importa o PREFIX
const { OWNER_JID } = require('../config'); // Importa o JID do dono

module.exports = async (sock, m, jid, args) => {
    try {
        const bugMessage = args.join(' ').trim(); // Pega a mensagem do bug

        if (!bugMessage) {
            return sock.sendMessage(jid, { text: `❌ Por favor, descreva o bug que você encontrou. Ex: *${PREFIX}bug A forca está travando o bot.*` }, { quoted: m });
        }

        if (!OWNER_JID) {
            console.error('OWNER_JID não está definido no config.js. Não é possível enviar o relatório de bug.');
            return sock.sendMessage(jid, { text: '❌ O dono do bot não está configurado para receber relatórios de bug.', quoted: m });
        }

        // Informações sobre quem enviou o bug
        const senderInfo = m.pushName || m.key.participant || m.key.remoteJid.split('@')[0];
        const fromJid = m.key.remoteJid; // JID de onde a mensagem veio (grupo ou privado)

        let reportMessage = `🐛 *NOVO RELATÓRIO DE BUG!* 🐛\n\n` +
                            `*De:* ${senderInfo} (@${fromJid.split('@')[0]})\n` +
                            `*ID do Chat:* ${fromJid}\n` +
                            `*Bug:* ${bugMessage}\n\n` +
                            `_Este relatório foi enviado via comando ${PREFIX}bug._`;
        
        // Tenta enviar a mensagem para o dono
        await sock.sendMessage(OWNER_JID, { text: reportMessage, mentions: [fromJid] }); // Menciona o remetente para o dono
        
        return sock.sendMessage(jid, { text: '✅ Seu relatório de bug foi enviado para o dono do bot. Obrigado por ajudar!', quoted: m });

    } catch (e) {
        console.error('Erro no comando bug:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao enviar o relatório de bug. Tente novamente mais tarde.', quoted: m });
    }
};