const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { randomUUID } = require('crypto');

module.exports = async function reverseCommand(sock, m, jid) {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const tipo = quoted?.videoMessage ? 'videoMessage' : null;

    if (!tipo) {
        await sock.sendMessage(jid, {
            text: '❌ Responda a um vídeo curto com `${PREFIX}reverse` para inverter o vídeo.'
        }, { quoted: m });
        return;
    }

    try {
        await sock.sendMessage(jid, {
            text: '⏪ Revertendo vídeo, aguarde...'
        }, { quoted: m });

        // Arquivos temporários
        const id = randomUUID();
        const inputPath = path.join(__dirname, `../temp/${id}.mp4`);
        const outputPath = path.join(__dirname, `../temp/${id}_reversed.mp4`);

        // Baixar vídeo
        const stream = await downloadContentFromMessage(quoted[tipo], 'video');
        const writeStream = fs.createWriteStream(inputPath);
        for await (const chunk of stream) writeStream.write(chunk);
        writeStream.end();

        // Esperar o término da escrita
        await new Promise(resolve => writeStream.on('finish', resolve));

        // Reverter o vídeo com ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
            .videoFilter('reverse')
            .audioFilter('areverse')
            .outputOptions('-preset ultrafast')
            .on('end', resolve)
            .on('error', reject)
            .save(outputPath);
        });

        const buffer = fs.readFileSync(outputPath);
        await sock.sendMessage(jid, {
            video: buffer,
            caption: '✅ Vídeo invertido com sucesso!',
            mimetype: 'video/mp4'
        }, { quoted: m });

        // Limpeza
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

    } catch (err) {
        console.error('Erro ao reverter vídeo:', err);
        await sock.sendMessage(jid, {
            text: '❌ Ocorreu um erro ao reverter o vídeo. Verifique se o vídeo é curto e válido.'
        }, { quoted: m });
    }
};
