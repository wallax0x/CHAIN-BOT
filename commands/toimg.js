const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { PREFIX } = require('../config');

module.exports = async (sock, m, jid) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    // REMOVIDO: if (!jid.endsWith('@g.us')) { return reply('❌ Este comando só pode ser usado em grupos.'); }
    // REMOVIDO: Validação de admin, pois este comando não precisa de admin.

    let mediaToProcess = null; // Objeto da mensagem de mídia (imageMessage, videoMessage, stickerMessage)
    let mediaType = '';       // 'image', 'video', 'sticker'
    let mimeType = '';        // Tipo MIME

    // 1. Prioridade: Figurinha enviada diretamente COM o comando (!toimg como legenda de figurinha)
    if (m.message?.stickerMessage) {
        mediaToProcess = m.message.stickerMessage;
        mediaType = 'sticker';
        mimeType = mediaToProcess.mimetype;
    }
    // 2. Segunda prioridade: Resposta a uma figurinha
    else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
        mediaToProcess = m.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
        mediaType = 'sticker';
        mimeType = mediaToProcess.mimetype;
    }

    // Se nenhuma figurinha foi encontrada
    if (!mediaToProcess) {
        return reply(`❌ Você precisa enviar uma *figurinha* com o comando *${PREFIX}toimg*, ou *responder* a uma figurinha com ele.`);
    }

    try {
        await reply('🔄 Convertendo figurinha para imagem, aguarde...'); 

        // Baixar a figurinha
        const stream = await downloadContentFromMessage(mediaToProcess, mediaType);
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const stickerBuffer = Buffer.concat(chunks);

        if (!stickerBuffer || stickerBuffer.length === 0) {
            return reply('❌ A figurinha baixada está vazia. Não foi possível converter.');
        }

        // Envia a figurinha como imagem (mimetype image/jpeg é mais universal para o WhatsApp)
        // O WhatsApp geralmente converte WEBP (sticker) para JPEG/PNG ao exibir como imagem.
        await sock.sendMessage(jid, { image: stickerBuffer, mimetype: 'image/jpeg' }, { quoted: m }); 

    } catch (e) {
        console.error('Erro no comando toimg:', e);
        return reply('❌ Ocorreu um erro inesperado ao converter a figurinha para imagem. Tente novamente mais tarde. Detalhes: ' + e.message);
    }
};