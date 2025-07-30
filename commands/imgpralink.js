const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadToTelegraph } = require('../utils/upload'); // Importa a função de upload

module.exports = async (sock, m, jid, args, command) => {
    try {
        const isImageInMessage = m.message?.imageMessage;
        const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedImage = quotedMessage && quotedMessage.imageMessage;
        
        if (!isImageInMessage && !isQuotedImage) {
            return sock.sendMessage(jid, { text: '❌ Marque uma imagem ou envie uma imagem com o comando para que eu possa converter em link.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '🔄 Convertendo imagem para link, aguarde...' }, { quoted: m });

        let mediaBuffer = null;
        let mimeType = '';
        let mediaMessage = null; // Objeto da mensagem de mídia (imageMessage)

        if (isImageInMessage) {
            mediaMessage = m.message.imageMessage;
            mimeType = mediaMessage.mimetype || 'image/jpeg';
        } else if (isQuotedImage) {
            mediaMessage = quotedMessage.imageMessage;
            mimeType = mediaMessage.mimetype || 'image/jpeg';
        }

        if (!mediaMessage) {
            return sock.sendMessage(jid, { text: '❌ Não foi possível encontrar a imagem para processamento.', quoted: m });
        }

        try {
            const stream = await downloadContentFromMessage(mediaMessage, 'image');
            mediaBuffer = Buffer.from([]);
            for await (const chunk of stream) {
                mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
            }
        } catch (dlError) {
            console.error('Erro ao baixar imagem para imgpralink:', dlError);
            return sock.sendMessage(jid, { text: '❌ Erro ao baixar a imagem. Tente novamente ou com outra imagem. Detalhes: ' + dlError.message, quoted: m });
        }

        if (!mediaBuffer || mediaBuffer.length === 0) {
            return sock.sendMessage(jid, { text: '❌ A imagem baixada está vazia. Não foi possível converter.', quoted: m });
        }

        // --- AQUI: Passa o mimeType e um nome de arquivo genérico ---
        const imageUrl = await uploadToTelegraph(mediaBuffer, mimeType, `image_upload_${Date.now()}`);

        await sock.sendMessage(jid, { text: `🔗 Link da imagem: ${imageUrl}` }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando imgpralink (catch geral):', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro inesperado ao converter a imagem para link. Tente novamente mais tarde. Detalhes: ' + e.message, quoted: m });
    }
};