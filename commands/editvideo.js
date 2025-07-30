// commands/editvideo.js
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { PREFIX } = require('../config');

const TEMP_FOLDER = path.resolve(__dirname, '..', 'temp');
const VIDEO_LIMIT_SECONDS = 15;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const effectConfig = {
    'reverso': { nome: 'Vídeo Reverso', emoji: '🔄', filtroFFmpeg: '-vf "reverse" -af "areverse"' },
    'lento': { nome: 'Slow Motion', emoji: '🐢', filtroFFmpeg: '-filter:v "setpts=2.0*PTS" -filter:a "atempo=0.5"' },
    'rapido': { nome: 'Fast-Forward', emoji: '🐇', filtroFFmpeg: '-filter:v "setpts=0.5*PTS" -filter:a "atempo=2.0"' },
    'mudo': { nome: 'Vídeo Mudo', emoji: '🔇', filtroFFmpeg: '-an' },
    'bass': { nome: 'Bass Boost', emoji: '🔊', filtroFFmpeg: '-af "bass=g=10,volume=2"' }
};

const command = async (sock, m, jid, args) => {
    const timestamp = Date.now();
    const inputPath = path.join(TEMP_FOLDER, `edit_in_${timestamp}.mp4`);
    const outputPath = path.join(TEMP_FOLDER, `edit_out_${timestamp}.mp4`);
    let sentMsg = null;

    try {
        const effectName = args[0]?.toLowerCase();

        if (!effectName) {
            let helpMessage = '🪄 *Editor de Vídeo*\n\n';
            helpMessage += `Envie ou responda a um vídeo com \`${PREFIX}editvideo <efeito>\`.\n\n`;
            helpMessage += '*Efeitos Disponíveis:*\n';
            for (const key in effectConfig) {
                helpMessage += `  - \`${key}\` (${effectConfig[key].nome})\n`;
            }
            return sock.sendMessage(jid, { text: helpMessage }, { quoted: m });
        }

        const config = effectConfig[effectName];
        if (!config) {
            return sock.sendMessage(jid, { text: `❌ Efeito "${effectName}" não encontrado. Use \`${PREFIX}editvideo\` para ver a lista.` }, { quoted: m });
        }
        
        // --- LÓGICA ATUALIZADA PARA DETECTAR VÍDEO (RESPOSTA OU LEGENDA) ---
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const messageWithVideo = quoted?.videoMessage ? quoted : m.message;
        const videoToProcess = messageWithVideo?.videoMessage;
        
        if (!videoToProcess) {
            return sock.sendMessage(jid, { text: `🎥 Você precisa enviar ou responder a um vídeo para usar o efeito *${effectName}*.` }, { quoted: m });
        }
        // --- FIM DA ATUALIZAÇÃO ---

        if (videoToProcess.seconds > VIDEO_LIMIT_SECONDS) {
            return sock.sendMessage(jid, { text: `❌ O vídeo é muito longo! O limite é de ${VIDEO_LIMIT_SECONDS} segundos.` }, { quoted: m });
        }
        
        await sock.sendMessage(jid, { react: { text: config.emoji, key: m.key } });
        sentMsg = await sock.sendMessage(jid, { text: `Ok! Preparando para aplicar o efeito *${config.nome}*...` }, { quoted: m });
        await delay(1500);

        await sock.sendMessage(jid, { text: `⚙️ Processando seu vídeo... isso pode demorar um pouco.`, edit: sentMsg.key });

        await fsp.mkdir(TEMP_FOLDER, { recursive: true });
        const stream = await downloadContentFromMessage(videoToProcess, 'video');
        const writer = fs.createWriteStream(inputPath);
        stream.pipe(writer);
        await new Promise((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });

        const ffmpegCommand = `ffmpeg -i ${inputPath} -y ${config.filtroFFmpeg} ${outputPath}`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => {
                if (error) { console.error('[FFMPEG ERROR]:', error); return reject(new Error('Falha na aplicação do efeito.')); }
                resolve();
            });
        });

        await sock.sendMessage(jid, { text: `✅ Efeito *${config.nome}* aplicado com sucesso!`, edit: sentMsg.key });
        await sock.sendMessage(jid, { video: { url: outputPath } });
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (err) {
        console.error(`Erro no comando editvideo:`, err);
        const effectName = args[0] || 'Desconhecido';
        const config = effectConfig[effectName] || { nome: 'Desconhecido' };
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        const errorMessage = `❌ Ops! Falha ao aplicar o efeito *${config.nome}*.\n\n_O vídeo pode estar corrompido ou o efeito não é compatível._`;
        if (sentMsg?.key) {
            await sock.sendMessage(jid, { text: errorMessage, edit: sentMsg.key });
        } else {
            await sock.sendMessage(jid, { text: errorMessage }, { quoted: m });
        }
    } finally {
        try {
            if (fs.existsSync(inputPath)) await fsp.unlink(inputPath);
            if (fs.existsSync(outputPath)) await fsp.unlink(outputPath);
        } catch (cleanupError) {
            console.error('[editvideo] Falha ao apagar arquivos temporários:', cleanupError);
        }
    }
};

module.exports = command;