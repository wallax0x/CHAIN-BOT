// commands/banall.js
const delay = require('../utils/delay');

// Mapeia IDs de grupo para o estado de confirmação do banall
const banallConfirmations = {}; // { groupId: { requesterId: '...', timestamp: Date.now() } }

const command = async (sock, m, jid, args, PREFIX) => {
    try {
        const groupId = jid;
        const senderId = m.key.participant || m.key.remoteJid;
        const action = args[0]?.toLowerCase();

        // Lógica de Confirmação (será chamada pelo messagesUpsert ou pelo comando completo)
        if (action === 's') {
            if (!banallConfirmations[groupId] || banallConfirmations[groupId].requesterId !== senderId || (Date.now() - banallConfirmations[groupId].timestamp > 10000)) {
                return sock.sendMessage(jid, { text: '❌ Não há pedido de banimento em massa pendente ou seu tempo de confirmação expirou (10 segundos).' }, { quoted: m });
            }

            delete banallConfirmations[groupId]; // Limpa o estado pendente

            await sock.sendMessage(jid, { text: '🔥 *CONFIRMADO!* Iniciando banimento em massa em...' }, { quoted: m });
            for (let i = 5; i > 0; i--) {
                await sock.sendMessage(jid, { text: `${i}...` });
                await delay(1000);
            }
            await sock.sendMessage(jid, { text: '💥 *REMOÇÃO INICIADA!* 💥' });

            const metadata = await sock.groupMetadata(groupId);
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const ownerId = metadata.owner;

            const membersToBan = metadata.participants
                .filter(p => p.id !== botId && p.id !== ownerId && p.id !== senderId && p.admin === null)
                .map(p => p.id);

            if (membersToBan.length === 0) {
                return sock.sendMessage(jid, { text: '🤷‍♀️ Não há membros para remover (excluindo admins, criador e bot).' }, { quoted: m });
            }

            let bannedCount = 0;
            for (const member of membersToBan) {
                try {
                    await sock.groupParticipantsUpdate(groupId, [member], 'remove');
                    bannedCount++;
                    await delay(500); // Pequeno delay entre cada remoção
                } catch (e) {
                    console.error(`Erro ao banir ${member}:`, e);
                }
            }
            
            await sock.sendMessage(jid, { text: `✅ *${bannedCount}* membros foram removidos com sucesso!` }, { quoted: m });

        } else if (action === 'n') { // Cancelamento
            if (banallConfirmations[groupId] && banallConfirmations[groupId].requesterId === senderId) {
                delete banallConfirmations[groupId];
                return sock.sendMessage(jid, { text: '❌ Pedido de banimento em massa cancelado.' }, { quoted: m });
            }
             // Não envia mensagem se não houver nada para cancelar, para não poluir o chat

        } else { // Início do Comando (Primeira Chamada com .banall)
            if (banallConfirmations[groupId]) {
                return sock.sendMessage(jid, { text: `⚠️ Já existe um pedido de banimento em massa pendente. Confirme com \`s\` ou cancele com \`n\`.` }, { quoted: m });
            }

            banallConfirmations[groupId] = { requesterId: senderId, timestamp: Date.now() };
            return sock.sendMessage(jid, { text: `⚠️ *ATENÇÃO!* Você está prestes a remover *TODOS* os membros deste grupo (exceto admins).\n\nPara *CONFIRMAR*, digite \`s\` (você tem 10 segundos).\nPara *CANCELAR*, digite \`n\`.` }, { quoted: m });
        }
    } catch (e) {
        console.error('Erro no comando banall:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro inesperado ao processar o comando banall.' }, { quoted: m });
    }
};

module.exports = command;
// Exporta o objeto de confirmações para que o messagesUpsert possa usá-lo
module.exports.banallConfirmations = banallConfirmations;