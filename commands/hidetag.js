// commands/hidetag.js

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const command = async (sock, m, jid, args) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    if (!jid.endsWith('@g.us')) {
        return reply('❌ Este comando só pode ser usado em grupos.');
    }

    try {
        const metadata = await sock.groupMetadata(jid);
        const admins = metadata.participants.filter(p => p.admin !== null).map(p => p.id);
        const sender = m.key.participant || m.key.remoteJid;

        // 1. Verifica se o remetente é um admin do grupo
        if (!admins.includes(sender)) {
            return reply('❌ Apenas administradores podem usar este comando.');
        }

        await sock.sendMessage(jid, { react: { text: '👻', key: m.key } });

        // 2. Prepara a lista de menções com todos os participantes
        const mentions = metadata.participants.map(p => p.id);
        
        // --- LÓGICA DE ENVIO VERSÁTIL ---

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const currentMsg = m.message;
        const textContent = args.join(' ').trim();

        // Cenário 1: Se o admin responde a uma mensagem
        if (quoted) {
            // Reenvia a mensagem respondida, adicionando a menção invisível
            return sock.sendMessage(jid, { forward: { key: m.message.extendedTextMessage.contextInfo.stanzaId, message: quoted }, mentions });
        }
        
        // Cenário 2: Se o admin envia uma mídia (imagem/vídeo) com o comando na legenda
        const mediaType = currentMsg.imageMessage ? 'image' : currentMsg.videoMessage ? 'video' : null;
        if (mediaType) {
            const stream = await downloadContentFromMessage(currentMsg[mediaType], mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return sock.sendMessage(jid, {
                [mediaType]: buffer,
                caption: textContent || '', // Usa o texto do comando como legenda
                mentions
            });
        }

        // Cenário 3: Se o admin envia apenas texto
        if (textContent) {
            return sock.sendMessage(jid, { text: textContent, mentions });
        }
        
        // Cenário 4: Se o admin envia apenas o comando .hidetag (sem texto ou mídia)
        // Envia uma mensagem com um caractere invisível para ativar as menções
        return sock.sendMessage(jid, { text: '\u200B', mentions });

    } catch (e) {
        console.error("Erro no comando hidetag:", e);
        reply('❌ Ocorreu um erro inesperado ao tentar executar a marcação.');
    }
};

module.exports = command;