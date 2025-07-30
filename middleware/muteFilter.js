const { readMutedMembersConfig } = require('../commands/mute');

module.exports = async (sock, m, jid, senderId, isGroup) => {
    if (isGroup && !m.key.fromMe) {
        const mutedMembersConfig = await readMutedMembersConfig();
        const groupMutedMembers = mutedMembersConfig[jid];

        if (groupMutedMembers && groupMutedMembers[senderId] === 1) {
            try {
                await sock.groupParticipantsUpdate(jid, [senderId], 'remove');
                await sock.sendMessage(jid, { text: `⚠️ Membro @${senderId.split('@')[0]} foi removido por tentar enviar mensagem enquanto silenciado.`, mentions: [senderId] });
            } catch (removeError) {
                console.error(`[MUTE] Erro ao tentar remover membro mutado ${senderId} do grupo ${jid}:`, removeError);
                await sock.sendMessage(jid, { text: `❌ Não foi possível remover @${senderId.split('@')[0]} que estava silenciado. O bot pode não ter permissão.`, mentions: [senderId] });
            }
            return false; 
        }
    }
    return true; 
}; // <-- AQUI ESTAVA FALTANDO ESTE FECHAMENTO DO MODULE.EXPORTS