module.exports = async (sock, m, jid, args) => {
    try {
        // Verifica se o comando foi usado em um grupo
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const groupId = jid;
        let memberToDemote = null;

        // Tenta identificar o membro a ser rebaixado via menção ou resposta
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            memberToDemote = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            memberToDemote = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (!memberToDemote) {
            return sock.sendMessage(jid, { text: '❌ Marque ou responda a mensagem do administrador que você deseja rebaixar.', quoted: m });
        }

        // Normaliza o ID do bot para comparação
        const botId = sock.user.id.includes('@s.whatsapp.net') ? sock.user.id : sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Evita que o bot tente rebaixar a si mesmo
        if (memberToDemote === botId) {
            return sock.sendMessage(jid, { text: '❌ Não posso rebaixar a mim mesmo.', quoted: m });
        }

        // Obtém os metadados do grupo para verificar o status atual do membro
        const metadata = await sock.groupMetadata(groupId);
        const participants = metadata.participants;

        const targetParticipant = participants.find(p => p.id === memberToDemote);

        if (!targetParticipant) {
            return sock.sendMessage(jid, { text: '❌ O membro mencionado não foi encontrado no grupo.', quoted: m });
        }

        // Verifica se o membro é administrador
        if (targetParticipant.admin === null) {
            return sock.sendMessage(jid, { text: '⚠️ Este membro não é um administrador do grupo.', quoted: m });
        }
        
        // Impede rebaixar o criador do grupo (que tem 'superadmin') se o bot for apenas 'admin'
        if (targetParticipant.admin === 'superadmin' && metadata.owner !== botId) { // Se o alvo é superadmin e o bot não é o criador
            return sock.sendMessage(jid, { text: '❌ Não posso rebaixar o criador/proprietário do grupo.', quoted: m });
        }


        // Tenta rebaixar o membro
        await sock.groupParticipantsUpdate(groupId, [memberToDemote], 'demote');
        await sock.sendMessage(jid, { text: `✅ Membro ${targetParticipant.id.split('@')[0]} rebaixado a membro comum com sucesso.`, quoted: m });

    } catch (e) {
        console.error('Erro no comando demote:', e);
        // Tratamento de erro mais específico para a API
        if (e.output && e.output.statusCode) {
            let errorMessage = `❌ Ocorreu um erro com a API do WhatsApp. Código: ${e.output.statusCode}.`;
            if (e.output.statusCode === 403) {
                errorMessage += ' Verifique se o bot é administrador do grupo e se tem permissão para rebaixar membros (ele não pode ser apenas admin se o alvo for o criador do grupo).';
            } else if (e.output.statusCode === 406) {
                 errorMessage += ' O número pode ser inválido ou não pode ser rebaixado.';
            }
            return sock.sendMessage(jid, { text: errorMessage }, { quoted: m });
        }
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro inesperado ao tentar rebaixar o membro.' + (e.message || ''), quoted: m });
    }
};