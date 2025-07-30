const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');
const { CONVERT_API_KEY } = require('../config.js');

module.exports = {
    command: async (sock, m, jid) => {
        try {
            const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMessage || !quotedMessage.stickerMessage) {
                return sock.sendMessage(jid, {
                    text: '❌ Por favor, responda a uma figurinha para converter em GIF.'
                }, { quoted: m });
            }

            await sock.sendMessage(jid, {
                react: { text: '🔄', key: m.key }
            });

            const stream = await downloadContentFromMessage(quotedMessage.stickerMessage, 'sticker');
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const stickerBuffer = Buffer.concat(chunks);

            console.log('[.togif] Enviando figurinha para a ConvertAPI...');

            const form = new FormData();
            form.append('file', stickerBuffer, {
                filename: 'sticker.webp',
                contentType: 'image/webp'
            });

            const response = await axios.post(
                `https://v2.convertapi.com/webp/to/gif?Secret=9XRh1YeSuH8YsooWVW8dIzVtn9nrBSja`,
                form,
                { headers: form.getHeaders() }
            );

            const gifUrl = response.data.Files?.[0]?.Url;
            if (!gifUrl) {
                throw new Error('URL do GIF não retornada pela API.');
            }

            console.log(`[.togif] GIF disponível em: ${gifUrl}`);

            const gifResponse = await axios.get(gifUrl, { responseType: 'arraybuffer' });
            const gifBuffer = Buffer.from(gifResponse.data);

            await sock.sendMessage(jid, {
                video: gifBuffer,
                gifPlayback: true
            }, { quoted: m });

            await sock.sendMessage(jid, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error("Erro no comando .togif:", error);
            await sock.sendMessage(jid, {
                text: '❌ Ocorreu um erro ao converter a figurinha. Verifique se ela não está corrompida ou tente novamente.'
            }, { quoted: m });
            await sock.sendMessage(jid, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};
