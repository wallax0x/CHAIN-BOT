const crypto = require('crypto'); // Garanta que esta linha esteja no topo

module.exports = {
    command: async (sock, m, jid, args) => {
        try {
            const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            if (!mentionedJid) {
                return sock.sendMessage(jid, { text: '❌ Você precisa mencionar um usuário.\n\n*Exemplo:*\n.fakechat @usuario / texto citado / sua resposta' }, { quoted: m });
            }

            const content = args.join(' ');
            const firstSlashIndex = content.indexOf('/');
            const secondSlashIndex = content.indexOf('/', firstSlashIndex + 1);

            if (firstSlashIndex === -1 || secondSlashIndex === -1) {
                return sock.sendMessage(jid, { text: '❌ Formato inválido. Use: .fakechat @usuario / texto citado / sua resposta' }, { quoted: m });
            }
            
            const quotedText = content.substring(firstSlashIndex + 1, secondSlashIndex).trim();
            const responseText = content.substring(secondSlashIndex + 1).trim();

            if (quotedText.length < 1 || responseText.length < 1) {
                 return sock.sendMessage(jid, { text: '❌ O texto citado e a resposta precisam ter pelo menos 1 caractere.' }, { quoted: m });
            }

            const fakeQuoted = {
                key: {
                    // --- A ADIÇÃO CRUCIAL ---
                    // Gera um ID de mensagem falso e aleatório. Isso é essencial.
                    id: crypto.randomBytes(12).toString('hex').toUpperCase(),
                    // --------------------------
                    fromMe: false,
                    participant: mentionedJid,
                    remoteJid: jid
                },
                message: {
                    extendedTextMessage: {
                        text: quotedText,
                        contextInfo: {
                            mentionedJid: [mentionedJid]
                        }
                    }
                }
            };

            await sock.sendMessage(
                jid,
                { text: responseText, mentions: [mentionedJid] },
                { quoted: fakeQuoted }
            );

        } catch (error) {
            console.error("Erro no comando .fakechat:", error);
            await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao criar a citação falsa.' }, { quoted: m });
        }
    }
};