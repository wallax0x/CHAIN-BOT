// commands/audio.js

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const fsp = require('fs').promises;
const fs = require('fs');
const path = require('path');
const { PREFIX } = require('../config');

const TEMP_FOLDER = path.resolve(__dirname, '..', 'temp');

const command = async (sock, m, jid, args) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });
    let statusMsg;

    const timestamp = Date.now();
    const inputPath = path.join(TEMP_FOLDER, `audio_in_${timestamp}.ogg`);
    const outputPath = path.join(TEMP_FOLDER, `audio_out_${timestamp}.mp3`);

    try {
        const effect = args[0]?.toLowerCase();
        
        // Mapa de efeitos disponíveis
        const effectsMap = {
            'reverso': 'areverse',
            'lento': 'atempo=0.7',
            'rapido': 'atempo=1.5',
            'estourado': 'volume=30dB',
            'grave': 'asetrate=44100*0.8,aresample=44100',
            'agudo': 'asetrate=44100*1.25,aresample=44100',
            'robotico': 'afftfilt="real=re*0.5:imag=im*0.5"',
            'eco': 'aecho=0.8:0.9:1000:0.3',
            'fantasma': 'aecho=0.8:0.9:1000:0.3,areverse',
            'chipmunk': 'asetrate=44100*1.5,atempo=1.1,aresample=44100',
            'demonio': 'asetrate=44100*0.6,atempo=0.9,aresample=44100',
        };

        if (!effect) {
            let helpMessage = `🎧 *Modificador de Áudio* 🎧\n\n` +
                              `*Responda a um áudio com:*\n\`${PREFIX}audio <efeito>\`\n\n` +
                              `*Efeitos Disponíveis:*\n`;
            Object.keys(effectsMap).forEach(eff => {
                helpMessage += `- \`${eff}\`\n`;
            });
            return reply(helpMessage.trim());
        }

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.audioMessage) {
            return reply(`❌ Você precisa responder a um áudio para aplicar o efeito "${effect}".`);
        }

        const filter = effectsMap[effect];
        if (!filter) return reply(`❌ Efeito "${effect}" não reconhecido.`);

        await sock.sendMessage(jid, { react: { text: '🎶', key: m.key } });
        statusMsg = await reply(`Aplicando o efeito *${effect}*... Aguarde!`);

        await fsp.mkdir(TEMP_FOLDER, { recursive: true });

        const downloadStream = await downloadContentFromMessage(quoted.audioMessage, 'audio');
        const chunks = [];
        for await (const chunk of downloadStream) chunks.push(chunk);
        await fsp.writeFile(inputPath, Buffer.concat(chunks));

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .audioFilters(filter)
                .toFormat('mp3')
                .save(outputPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        await sock.sendMessage(jid, {
            audio: { url: outputPath },
            mimetype: 'audio/mpeg',
            ptt: quoted.audioMessage.ptt === true
        }, { quoted: m });
        
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        await sock.sendMessage(jid, { text: `✅ Efeito *${effect}* aplicado com sucesso!`, edit: statusMsg.key });

    } catch (err) {
        console.error('[audio] Erro:', err);
        const errorMessage = '❌ Erro ao processar o áudio. Verifique se o FFmpeg está instalado corretamente no servidor.';
        if (statusMsg) {
            await sock.sendMessage(jid, { text: errorMessage, edit: statusMsg.key });
        } else {
            reply(errorMessage);
        }
    } finally {
        // Limpeza segura dos arquivos temporários
        try {
            if (fs.existsSync(inputPath)) await fsp.unlink(inputPath);
            if (fs.existsSync(outputPath)) await fsp.unlink(outputPath);
        } catch (cleanupError) {
            console.error('[audio] Erro ao limpar arquivos temporários:', cleanupError);
        }
    }
};

module.exports = command;