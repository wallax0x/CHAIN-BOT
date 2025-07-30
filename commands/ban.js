// Importa os módulos necessários do Node.js
const fs = require('fs');
const path = require('path');

module.exports = async (sock, m, jid) => {
    try {
        // Verifica se o comando está sendo usado em um grupo
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const groupId = jid;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // Puxamos os metadados do grupo no início para ter a lista de participantes
        const metadata = await sock.groupMetadata(groupId);
        
        let userToBan = null;
        let keyToDelete = null;

        const contextInfo = m.message.extendedTextMessage?.contextInfo;

        // Verifica se há usuários mencionados ou se a mensagem é uma resposta
        if (contextInfo?.mentionedJid?.length > 0) {
            userToBan = contextInfo.mentionedJid[0];
        } else if (contextInfo?.quotedMessage) {
            userToBan = contextInfo.participant;
            keyToDelete = {
                remoteJid: jid,
                fromMe: userToBan === botId,
                id: contextInfo.stanzaId,
                participant: userToBan
            };
        } else {
            return sock.sendMessage(jid, { text: '❌ Marque ou responda a mensagem de quem você deseja remover.' }, { quoted: m });
        }

        // --- VERIFICAÇÃO SE O USUÁRIO ESTÁ NO GRUPO ---
        const isParticipant = metadata.participants.some(p => p.id === userToBan);
        if (!isParticipant) {
            return sock.sendMessage(jid, { text: 'ℹ️ Não é possível remover este usuário, pois ele não está mais no grupo.' }, { quoted: m });
        }
        // --- FIM DA NOVA VERIFICAÇÃO ---

        // Verifica se o usuário a ser banido é o próprio bot
        if (userToBan === botId) {
            return sock.sendMessage(jid, { text: '❌ Não posso me remover do grupo.' }, { quoted: m });
        }
        
        // Verifica se o usuário a ser banido é um administrador
        const targetIsAdmin = !!metadata.participants.find(p => p.id === userToBan)?.admin;
        if (targetIsAdmin) {
            return sock.sendMessage(jid, { text: '❌ Não posso remover um administrador do grupo.' }, { quoted: m });
        }
        
        // Tenta deletar a mensagem que contém o comando
        if (keyToDelete) {
            try {
                await sock.sendMessage(jid, { delete: keyToDelete });
            } catch (e) {
                console.error("Falha ao deletar a mensagem:", e);
                await sock.sendMessage(jid, { text: '⚠️ Não consegui apagar a mensagem, mas prosseguirei com a remoção.' }, { quoted: m });
            }
        }

        // Executa a remoção do usuário
        await sock.groupParticipantsUpdate(groupId, [userToBan], 'remove');
        
        // Envia uma mensagem de sucesso
        await sock.sendMessage(jid, { text: `✅ Usuário @${userToBan.split('@')[0]} foi banido com sucesso.`, mentions: [userToBan] });

        // --- CÓDIGO DA NOTA DE VOZ (AGORA RESPONDENDO) ---
        const audioPath = path.join(__dirname, '..', 'utils', 'banido.mp3');

        if (fs.existsSync(audioPath)) {
            await sock.sendMessage(jid, {
                audio: { url: audioPath },
                mimetype: 'audio/mpeg',
                ptt: true 
            }, { quoted: m }); // Adicionamos { quoted: m } para responder à mensagem original
        } else {
            console.warn(`[AVISO] Arquivo de áudio para banimento não encontrado em: ${audioPath}`);
        }
        // --- FIM DO CÓDIGO DA NOTA DE VOZ ---

    } catch (e) {
        console.error('Erro no comando ban:', e);
        if (e.output?.statusCode === 403) {
            return sock.sendMessage(jid, { text: '❌ Erro: Não tenho permissão para remover este usuário.' }, { quoted: m });
        }
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro desconhecido ao tentar remover o usuário.' }, { quoted: m });
    }
};