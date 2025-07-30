// commands/play.js
const axios = require('axios');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { API_KEY, PREFIX } = require('../config');

const command = async (sock, m, jid, args) => {
    const query = args.join(' ').trim();
    const tempDir = path.join(__dirname, '..', 'temp');
    let audioPath = '';

    try {
        if (!query) {
            return sock.sendMessage(jid, { text: `▶️ Exemplo: *${PREFIX}play nome da música*` }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🎵', key: m.key } });
        await fsp.mkdir(tempDir, { recursive: true });

        const searchApiUrl = `https://api.bronxyshost.com.br/api-bronxys/pesquisa_ytb?nome=${encodeURIComponent(query)}&apikey=${API_KEY}`;
        const searchResponse = await axios.get(searchApiUrl);
        const videoData = searchResponse.data[0];

        if (!videoData) throw new Error('Nenhum resultado encontrado.');

        const thumb = videoData.thumb?.startsWith('http') ? videoData.thumb : 'https://i.ibb.co/T4Lz2n5/7309681.jpg';
        
        // --- MENSAGEM CORRIGIDA ---
        // A linha "Canal" foi removida e a "Postado" foi adicionada.
        const detailsMessage = `
🎶 *Música Encontrada* 🎶

*Título:* ${videoData.titulo || 'Não informado'}
*Duração:* ${videoData.tempo || 'N/A'}
*Postado há:* ${videoData.postado || 'N/A'}

* baixando o áudio...*
        `.trim();
        
        await sock.sendMessage(jid, { image: { url: thumb }, caption: detailsMessage }, { quoted: m });
        
        const downloadApiUrl = `https://api.bronxyshost.com.br/api-bronxys/play?nome_url=${encodeURIComponent(query)}&apikey=${API_KEY}`;
        audioPath = path.join(tempDir, `audio_${Date.now()}.mp3`);

        const audioResponse = await axios({ method: 'GET', url: downloadApiUrl, responseType: 'stream' });
        const writer = fs.createWriteStream(audioPath);
        audioResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await sock.sendMessage(jid, { audio: { url: audioPath }, mimetype: 'audio/mpeg' }, { quoted: m });
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error('[play] Erro no comando play:', e);
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { text: '❌ Erro ao buscar ou baixar a música.' }, { quoted: m });
    } finally {
        if (audioPath && fs.existsSync(audioPath)) {
            try {
                await fsp.unlink(audioPath);
            } catch (cleanupError) {
                // Ignora o erro se o arquivo já foi apagado
            }
        }
    }
};

module.exports = command;