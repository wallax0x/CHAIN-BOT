// commands/add.js

const { PREFIX } = require('../config');

module.exports = async (sock, m, jid, args, senderId) => {
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const numberInput = args.join('');
        if (!numberInput) {
            return sock.sendMessage(jid, { text: `❌ Você precisa informar o número a ser adicionado.\n\n*Exemplo:* ${PREFIX}add 5521999998888` }, { quoted: m });
        }

        const cleanedNumber = numberInput.replace(/[^0-9]/g, '');
        if (cleanedNumber.length < 10) {
             return sock.sendMessage(jid, { text: `❌ O número "${cleanedNumber}" parece ser inválido.` }, { quoted: m });
        }

        const memberToAdd = cleanedNumber + '@s.whatsapp.net';

        const metadata = await sock.groupMetadata(jid);
        if (metadata.participants.some(p => p.id === memberToAdd)) {
            return sock.sendMessage(jid, { text: '⚠️ Este membro já está no grupo.' }, { quoted: m });
        }

        const response = await sock.groupParticipantsUpdate(jid, [memberToAdd], 'add');
        const addResult = response[0];
        const statusCode = addResult?.status;

        // --- AQUI ESTÁ A MUDANÇA ---
        if (statusCode === '200') {
            // Se deu certo, agora ele apenas reage à mensagem original
            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

        } else if (statusCode === '403') {
            const message = `❌ Não foi possível adicionar @${cleanedNumber} diretamente.\n\n*Motivo provável:* As configurações de privacidade do usuário impedem.\n\n*Plano B:* Gerando um link de convite...`;
            await sock.sendMessage(jid, { text: message, mentions: [memberToAdd] });
            try {
                const inviteCode = await sock.groupInviteCode(jid);
                const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
                const linkMessage = `Aqui está o link de convite para o grupo *${metadata.subject}*.\n\nEnvie para a pessoa:\n${inviteLink}`;
                await sock.sendMessage(senderId, { text: linkMessage });
            } catch (inviteError) {
                await sock.sendMessage(jid, { text: '❌ Falhei em criar um link de convite. Verifique se ainda sou admin.' });
            }
        } else if (statusCode === '409') {
            await sock.sendMessage(jid, { text: `❌ Não foi possível adicionar. O membro @${cleanedNumber} saiu recentemente e precisa esperar para ser adicionado.`, mentions: [memberToAdd] });
        } else {
            await sock.sendMessage(jid, { text: `❌ Ocorreu um erro ao adicionar o membro. Status: ${statusCode || 'Desconhecido'}` }, { quoted: m });
        }

    } catch (e) {
        console.error('Erro no comando add:', e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro. Verifique se o número é um WhatsApp válido.' }, { quoted: m });
    }
};