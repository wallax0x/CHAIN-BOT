// commands/d.js

module.exports = async (sock, m, jid) => {
    try {
        const contextInfo = m.message.extendedTextMessage?.contextInfo;
        const quotedMessage = contextInfo?.quotedMessage;

        if (!quotedMessage) {
            return sock.sendMessage(jid, { text: '❌ Para apagar uma mensagem, você precisa respondê-la com o comando.' }, { quoted: m });
        }

        const groupMetadata = await sock.groupMetadata(jid);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botIsAdmin = !!groupMetadata.participants.find(p => p.id === botId)?.admin;

        if (!botIsAdmin) {
            return sock.sendMessage(jid, { text: '❌ Não consigo apagar esta mensagem pois não sou um administrador deste grupo.' }, { quoted: m });
        }

        const keyToDelete = {
            remoteJid: jid,
            fromMe: contextInfo.participant === botId,
            id: contextInfo.stanzaId,
            participant: contextInfo.participant
        };

        // Envia a ordem para deletar a mensagem
        await sock.sendMessage(jid, { delete: keyToDelete });

        // --- NOVO: Reage na mensagem do admin para confirmar ---
        await sock.sendMessage(jid, {
            react: {
                text: '✅', // Emoji de confirmação
                key: m.key  // A chave da mensagem de comando (ex: a mensagem ".d")
            }
        });
        
    } catch (e) {
        console.error("Erro no comando .d:", e);
        // Em caso de erro, reage com um emoji de falha
        await sock.sendMessage(jid, {
            react: {
                text: '❌',
                key: m.key
            }
        });
    }
};