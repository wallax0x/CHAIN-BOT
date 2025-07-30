// commands/montagem.js
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { API_KEY } = require('../config');
const { upload } = require('../utils/uploader');

const command = async (sock, m, jid, comando) => {
    try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const messageWithImage = quoted?.imageMessage ? quoted : m.message;
        
        if (!messageWithImage?.imageMessage) {
            return sock.sendMessage(jid, { text: '🖼️ Você precisa enviar ou responder a uma imagem.' }, { quoted: m });
        }
        
        await sock.sendMessage(jid, { react: { text: '🎨', key: m.key } });
        const sentMsg = await sock.sendMessage(jid, { text: `Ok! Preparando a montagem "${comando}"...` }, { quoted: m });
        
        // Baixa a imagem para um buffer
        const stream = await downloadContentFromMessage(messageWithImage.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        // Faz o upload da imagem para obter um link
        await sock.sendMessage(jid, { text: '✅ Imagem recebida!\n\n📤 _Fazendo upload para o servidor..._', edit: sentMsg.key });
        const imageUrl = await upload(buffer);

        // Constrói a URL da API da Bronxys
        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/montagem?url=${imageUrl}&category=${comando}&apikey=${API_KEY}`;
        
        await sock.sendMessage(jid, { text: '✅ Upload concluído!\n\n✨ _Aplicando o efeito..._', edit: sentMsg.key });

        // Envia a imagem final processada pela API
        await sock.sendMessage(jid, { image: { url: apiUrl } }, { quoted: m });
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        
    } catch (e) {
        console.error(`Erro no comando ${comando}:`, e);
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao criar a montagem. A API pode estar offline ou a imagem é inválida.' }, { quoted: m });
    }
};

module.exports = command;