// commands/tomp3.js

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { PREFIX } = require('../config');

const TEMP_FOLDER = path.resolve(__dirname, '..', 'temp');

const command = async (sock, m, jid) => {
    let inputPath = '';
    let outputPath = '';

    try {
        // Verifica se o comando é uma resposta a um vídeo
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.videoMessage) {
            return sock.sendMessage(jid, { text: `🎥 Você precisa responder a um vídeo com o comando \`${PREFIX}tomp3\` para extrair o áudio.` }, { quoted: m });
        }

        // Reage para dar feedback ao usuário
        await sock.sendMessage(jid, { react: { text: '🔄', key: m.key } });

        // Garante que a pasta temp existe
        await fsp.mkdir(TEMP_FOLDER, { recursive: true });
        
        // Baixa o vídeo para um arquivo temporário
        const stream = await downloadContentFromMessage(quoted.videoMessage, 'video');
        const timestamp = Date.now();
        inputPath = path.join(TEMP_FOLDER, `tomp3_in_${timestamp}.mp4`);

        const writer = fs.createWriteStream(inputPath);
        stream.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Prepara o caminho do arquivo de saída
        outputPath = path.join(TEMP_FOLDER, `tomp3_out_${timestamp}.mp3`);

        // Comando FFmpeg para extrair o áudio para MP3
        // -vn (sem vídeo) -c:a libmp3lame (codec de áudio mp3) -q:a 2 (boa qualidade)
        const ffmpegCommand = `ffmpeg -i ${inputPath} -y -vn -c:a libmp3lame -q:a 2 ${outputPath}`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error('[tomp3 FFmpeg ERROR]:', stderr);
                    return reject(new Error('Falha na conversão do áudio com FFmpeg.'));
                }
                resolve();
            });
        });

        // Envia o arquivo de áudio extraído
        await sock.sendMessage(jid, {
            audio: { url: outputPath },
            mimetype: 'audio/mpeg'
        }, { quoted: m });

        // Reação de sucesso
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Erro no comando tomp3:", e);
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao extrair o áudio. O vídeo pode estar corrompido.' }, { quoted: m });
    } finally {
        // Limpa os arquivos temporários (input e output)
        try {
            if (inputPath && fs.existsSync(inputPath)) await fsp.unlink(inputPath);
            if (outputPath && fs.existsSync(outputPath)) await fsp.unlink(outputPath);
        } catch (cleanupError) {
            console.error('[tomp3] Falha ao apagar arquivos temporários:', cleanupError);
        }
    }
};

module.exports = command;