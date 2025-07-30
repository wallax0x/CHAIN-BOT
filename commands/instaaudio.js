// commands/instaaudio.js
const axios = require('axios');
const { API_KEY, PREFIX } = require('../config');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const TEMP_FOLDER = path.resolve(__dirname, '..', 'temp');

const command = async (sock, m, jid, args) => {
    try {
        const url = args[0];

        if (!url || !url.includes('instagram.com')) {
            return sock.sendMessage(jid, { text: `❓ Por favor, envie um link válido de um post do Instagram.\n\nExemplo: \`${PREFIX}instaaudio <link_do_post>\`` }, { quoted: m });
        }

        // --- REAÇÃO DE PROCESSAMENTO ---
        await sock.sendMessage(jid, { react: { text: '🔄', key: m.key } });

        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/instagram?url=${encodeURIComponent(url)}&apikey=${API_KEY}`;
        
        const response = await axios.get(apiUrl);
        const results = response.data;

        if (!results || !Array.isArray(results.msg) || results.msg.length === 0) {
            throw new Error('A resposta da API não contém a mídia esperada.');
        }

        const media = results.msg[0];
        const mediaType = media.type.toLowerCase();
        const mediaUrl = media.url;
        
        if (mediaType === 'mp4') {
            const timestamp = Date.now();
            const inputPath = path.join(TEMP_FOLDER, `insta_video_in_${timestamp}.mp4`);
            const outputPath = path.join(TEMP_FOLDER, `insta_audio_out_${timestamp}.mp3`);

            const videoResponse = await axios({ method: 'GET', url: mediaUrl, responseType: 'stream' });
            const writer = fs.createWriteStream(inputPath);
            videoResponse.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const ffmpegCommand = `ffmpeg -i ${inputPath} -y -vn -c:a libmp3lame -q:a 2 ${outputPath}`;

            await new Promise((resolve, reject) => {
                exec(ffmpegCommand, (error) => error ? reject(error) : resolve());
            });

            await sock.sendMessage(jid, {
                audio: { url: outputPath },
                mimetype: 'audio/mpeg'
            }, { quoted: m });
            
            await fsp.unlink(inputPath);
            await fsp.unlink(outputPath);

        } else if (mediaType === 'jpg' || mediaType === 'jpeg' || mediaType === 'png') {
            await sock.sendMessage(jid, { 
                image: { url: mediaUrl }, 
                caption: 'Este post não contém um vídeo, então aqui está a imagem dele.' 
            }, { quoted: m });
        } else {
            throw new Error(`Formato de mídia não suportado: ${mediaType}`);
        }

        // --- REAÇÃO DE SUCESSO ---
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Erro no comando instaaudio:", e);
        // --- REAÇÃO DE ERRO ---
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { text: '❌ Falha ao processar o link. O post pode ser privado ou a API está com problemas.' }, { quoted: m });
    }
};

module.exports = command;