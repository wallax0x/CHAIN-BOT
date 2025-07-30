// commands/aluguel.js
const { OWNER_JID, PREFIX } = require('../config');
const { readRentals, writeRentals } = require('../utils/rental_checker');

const command = async (sock, m, jid, args, senderId) => {
    try {
        if (senderId !== OWNER_JID) {
            return sock.sendMessage(jid, { text: '❌ Este comando é restrito ao meu dono.' }, { quoted: m });
        }

        const link = args[0];
        const days = parseInt(args[1]);

        if (!link || !link.includes('chat.whatsapp.com/') || !days || isNaN(days)) {
            return sock.sendMessage(jid, { text: `❓ Formato incorreto. Use:\n\`${PREFIX}aluguel <link> <dias>\`` }, { quoted: m });
        }

        const inviteCode = link.split('chat.whatsapp.com/')[1];
        if (!inviteCode) {
            return sock.sendMessage(jid, { text: '❌ Link de convite inválido.' }, { quoted: m });
        }
        
        await sock.sendMessage(jid, { text: `⏳ Verificando o link e registrando aluguel por ${days} dias...` }, { quoted: m });

        // --- NOVA LÓGICA: Descobre o ID do grupo ANTES de entrar ---
        // 1. Pega as informações do grupo através do código de convite
        const groupInfo = await sock.groupGetInviteInfo(inviteCode);
        const newGroupId = groupInfo.id;

        if (!newGroupId) {
            throw new Error('Não foi possível obter o ID do grupo a partir do link.');
        }
        console.log(`[Aluguel] ID do grupo obtido com sucesso: ${newGroupId}`);
        
        // 2. Agora que temos o ID, podemos registrar o aluguel corretamente
        const expirationTimestamp = Date.now() + (days * 24 * 60 * 60 * 1000);
        const expirationDate = new Date(expirationTimestamp).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        const rentals = await readRentals();
        rentals[newGroupId] = {
            expirationTimestamp: expirationTimestamp,
            rentedBy: senderId,
            days: days
        };
        await writeRentals(rentals);

        // 3. Só depois de tudo salvo, o bot tenta entrar no grupo
        await sock.groupAcceptInvite(inviteCode);
        
        // Mensagem de confirmação para o dono
        await sock.sendMessage(jid, { text: `✅ Aluguel para o grupo *${groupInfo.subject}* foi registrado com sucesso.\n\n*ID:* \`${newGroupId}\`\n*Expira em:* ${days} dias (${expirationDate})\n\n_Aguardando aprovação para entrar no grupo, se necessário..._` }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando aluguel:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro. O link pode ser inválido, revogado, ou eu já estou no grupo.' }, { quoted: m });
    }
};

module.exports = command;