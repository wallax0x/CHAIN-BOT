module.exports = async (sock, m, jid, args) => {
    try {
        // Verifica se o comando foi usado em um grupo
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const groupId = jid;
        let memberToPromote = null;

        // Tenta identificar o membro a ser promovido via menção ou resposta
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            memberToPromote = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            memberToPromote = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (!memberToPromote) {
            return sock.sendMessage(jid, { text: '❌ Marque ou responda a mensagem do membro que você deseja promover.', quoted: m });
        }

        // Normaliza o ID do bot para comparação
        const botId = sock.user.id.includes('@s.whatsapp.net') ? sock.user.id : sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Evita promover o próprio bot
        if (memberToPromote === botId) {
            return sock.sendMessage(jid, { text: '❌ Não posso promover a mim mesmo.', quoted: m });
        }

        // Obtém os metadados do grupo para verificar o status atual do membro
        const metadata = await sock.groupMetadata(groupId);
        const participants = metadata.participants;

        const targetParticipant = participants.find(p => p.id === memberToPromote);

        if (!targetParticipant) {
            return sock.sendMessage(jid, { text: '❌ O membro mencionado não foi encontrado no grupo.', quoted: m });
        }

        // Verifica se o membro já é administrador
        if (targetParticipant.admin !== null) {
            return sock.sendMessage(jid, { text: '⚠️ Este membro já é um administrador do grupo.', quoted: m });
        }

        // Tenta promover o membro
        await sock.groupParticipantsUpdate(groupId, [memberToPromote], 'promote');
        await sock.sendMessage(jid, { text: `✅ Membro ${targetParticipant.id.split('@')[0]} promovido a administrador com sucesso.`, quoted: m });

    } catch (e) {
        console.error('Erro no comando promover:', e);
        // Tratamento de erro mais específico para a API
        if (e.output && e.output.statusCode) {
            let errorMessage = `❌ Ocorreu um erro com a API do WhatsApp. Código: ${e.output.statusCode}.`;
            if (e.output.statusCode === 403) {
                errorMessage += ' Verifique se o bot é administrador do grupo e se tem permissão para promover membros.';
            } else if (e.output.statusCode === 406) {
                 errorMessage += ' O número pode ser inválido ou não pode ser promovido.';
            }
            return sock.sendMessage(jid, { text: errorMessage }, { quoted: m });
        }
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro inesperado ao tentar promover o membro.' }, { quoted: m });
    }
};