// commands/seticon.js

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp'); // Usaremos a 'sharp' para converter figurinhas

const command = async (sock, m, jid, args, PREFIX) => {
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' });
        }

        console.log("Comando seticon iniciado");

        let imageMessageToDownload = null;
        let stickerMessageToDownload = null;

        // --- LÓGICA ATUALIZADA PARA IDENTIFICAR A IMAGEM/FIGURINHA ---

        // 1. Verifica se o comando veio na legenda de uma imagem
        if (m.message?.imageMessage) {
            imageMessageToDownload = m.message.imageMessage;
            console.log("Fonte: Imagem enviada com legenda.");
        }
        // 2. Se não, verifica se é uma resposta a uma mensagem
        else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
            // 2a. Verifica se a resposta foi em uma imagem
            if (quoted.imageMessage) {
                imageMessageToDownload = quoted.imageMessage;
                console.log("Fonte: Resposta a uma imagem.");
            }
            // 2b. Verifica se a resposta foi em uma figurinha
            else if (quoted.stickerMessage) {
                stickerMessageToDownload = quoted.stickerMessage;
                console.log("Fonte: Resposta a uma figurinha.");
            }
        }

        // Se nenhuma fonte de imagem/figurinha foi encontrada, envia erro
        if (!imageMessageToDownload && !stickerMessageToDownload) {
            return sock.sendMessage(jid, {
                text: `🖼️ *Como usar o comando:*\n\n1. Responda a uma imagem ou figurinha com \`${PREFIX}seticon\`.\n\n*OU*\n\n2. Envie uma imagem com a legenda \`${PREFIX}seticon\`.`
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '✨ Alterando o ícone do grupo, aguarde...' }, { quoted: m });

        let imageBuffer;

        // Baixa e processa a mídia
        if (imageMessageToDownload) {
            const stream = await downloadContentFromMessage(imageMessageToDownload, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            imageBuffer = buffer;
        } else { // Se for uma figurinha
            const stream = await downloadContentFromMessage(stickerMessageToDownload, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            // Converte o buffer da figurinha (geralmente webp) para JPEG
            imageBuffer = await sharp(buffer).jpeg().toBuffer();
        }

        // Atualiza a foto de perfil (ícone) do grupo
        await sock.updateProfilePicture(jid, imageBuffer);

        // A reação de sucesso é suficiente, o WhatsApp já notifica a mudança
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Erro no comando seticon:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro. Verifique se sou admin e se a mídia é válida.' }, { quoted: m });
    }
};

module.exports = command;