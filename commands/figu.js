const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const webp = require('node-webpmux');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const crypto = require('crypto');

// --- Configurações Otimizadas ---
const PACK_NAME = "Feito por";
const AUTHOR_NAME = "CHAIN 🤖";
const STICKER_QUALITY = 50;
const MAX_VIDEO_DURATION = 9; // Duração reduzida
const STICKER_FPS = 12;      // FPS reduzido

async function downloadToBuffer(mediaMessage) {
    const type = mediaMessage.mimetype.startsWith('image') ? 'image' : 'video';
    const stream = await downloadContentFromMessage(mediaMessage, type);
    const chunks = [];
    for await (const chunk of stream) { chunks.push(chunk) };
    return Buffer.concat(chunks);
}

async function convertVideoToWebpBuffer(inputBuffer) {
    const tempInputPath = path.join(os.tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);
    const tempOutputPath = path.join(os.tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    try {
        await fs.writeFile(tempInputPath, inputBuffer);
        await new Promise((resolve, reject) => {
            ffmpeg(tempInputPath)
                .toFormat('webp')
                .withNoAudio()
                .addOutputOptions('-fs', '450K') // <-- Limite de tamanho do arquivo
                .withOutputOptions('-vf', `scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=${STICKER_FPS}`)
                .on('error', (err) => reject(new Error(`Erro no FFMPEG: ${err.message}`)))
                .on('end', () => resolve())
                .save(tempOutputPath);
        });
        const outputBuffer = await fs.readFile(tempOutputPath);
        return outputBuffer;
    } finally {
        try { await fs.unlink(tempInputPath); } catch (_) {}
        try { await fs.unlink(tempOutputPath); } catch (_) {}
    }
}

async function addExif(webpBuffer, packname, author) {
    const img = new webp.Image();
    await img.load(webpBuffer);
    const stickerPackId = 'seu-nome-de-bot-aqui-12345';
    const json = {
        'sticker-pack-id': stickerPackId,
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        'android-app-store-link': '',
        'ios-app-store-link': ''
    };
    const exif = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exifJson = Buffer.concat([exif, jsonBuffer]);
    exifJson.writeUIntLE(jsonBuffer.length, 14, 4);
    img.exif = exifJson;
    return await img.save(null);
}

// --- Comando Principal ---
const command = async (sock, m, jid) => {
    try {
        // ... (resto do comando principal, sem alterações)
        const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const messageToProcess = quotedMessage || m.message;
        const mediaMessage = messageToProcess.imageMessage || messageToProcess.videoMessage;

        if (!mediaMessage) {
            return sock.sendMessage(jid, { text: '❌ Envie ou responda a uma *imagem* ou *vídeo*.' }, { quoted: m });
        }
        
        if (mediaMessage.seconds && mediaMessage.seconds > MAX_VIDEO_DURATION) {
            return sock.sendMessage(jid, { text: `❌ O vídeo é muito longo! Máximo de ${MAX_VIDEO_DURATION} segundos.` }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🔄', key: m.key } });

        const buffer = await downloadToBuffer(mediaMessage);
        const author = m.pushName || AUTHOR_NAME;
        const isVideo = mediaMessage.mimetype.startsWith('video');

        let finalStickerBuffer;

        if (isVideo) {
            const rawWebpBuffer = await convertVideoToWebpBuffer(buffer);
            finalStickerBuffer = await addExif(rawWebpBuffer, PACK_NAME, author);
        } else {
            const sticker = new Sticker(buffer, {
                pack: PACK_NAME,
                author: author,
                type: StickerTypes.CROP,
                quality: STICKER_QUALITY
            });
            finalStickerBuffer = await sticker.toBuffer();
        }

        await sock.sendMessage(jid, { sticker: finalStickerBuffer }, { quoted: m });
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error("Erro ao criar figurinha:", err);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar a mídia. O formato pode ser inválido ou o vídeo muito longo.' }, { quoted: m });
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
    }
};

module.exports = {
    command
};