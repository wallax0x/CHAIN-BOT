// home/container/commands/ytmp4.js

const axios = require('axios');
const config = require('../config');

/**
 * Função principal que baixa um vídeo do YouTube usando apenas a API BronxysHost.
 * @param {any} sock - A instância da conexão Baileys.
 * @param {any} msg - O objeto da mensagem original para responder.
 * @param {string} jid - O JID (ID do chat) para enviar a mensagem.
 * @param {string} query - O nome ou link do vídeo.
 */
const downloadYoutubeVideo = async (sock, msg, jid, query) => {
    const react = async (emoji) => {
        await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });
    };

    // NOVO: Variável para guardar a mensagem de status que será editada.
    let sentMsg;

    try {
        await react('🔎');
        // NOVO: Enviamos a primeira mensagem e guardamos seus dados em 'sentMsg'.
        sentMsg = await sock.sendMessage(jid, { text: `🔎 Buscando informações sobre: *${query}*` }, { quoted: msg });

        const search = await axios.get(`https://api.bronxyshost.com.br/api-bronxys/pesquisa_ytb?nome=${encodeURIComponent(query)}&apikey=${config.API_KEY}`);
        const data = search.data;

        if (!Array.isArray(data) || !data[0]) {
            await react('❓');
            // NOVO: Editamos a mensagem original para mostrar o erro.
            throw new Error('Nenhum resultado encontrado na API.');
        }
        
        const video = data[0];
        const videoTitulo = video.titulo;
        const videoUrlParaDownload = video.url;

        if (video.tempo?.length >= 7) {
            await react('⏱️');
            // NOVO: Editamos a mensagem original para mostrar o erro de duração.
            return await sock.sendMessage(jid, { text: '⏱️ Vídeo muito longo! O limite é de aproximadamente 10-15 minutos.', edit: sentMsg.key });
        }

        await react('📥');
        // NOVO: Editamos a mensagem de "Buscando..." para "Baixando...".
        await sock.sendMessage(jid, { 
            text: `📥 Baixando o vídeo *${videoTitulo}*...\n\nAguarde alguns segundos...`, 
            edit: sentMsg.key 
        });

        const downloadApiUrl = `https://api.bronxyshost.com.br/api-bronxys/play_video?nome_url=${encodeURIComponent(videoUrlParaDownload)}&apikey=${config.API_KEY}`;
        const videoResponse = await axios.get(downloadApiUrl, {
            responseType: 'arraybuffer',
            timeout: 90000,
        });
        const videoBuffer = Buffer.from(videoResponse.data);

        if (videoBuffer.length < 10000) {
            await react('⚠️');
             // NOVO: Editamos a mensagem para mostrar o erro de download.
            return await sock.sendMessage(jid, { text: '⚠️ O download falhou. O vídeo pode ser privado ou corrompido.', edit: sentMsg.key });
        }

        await react('✅');
        // NOVO: Editamos a mensagem uma última vez antes de enviar o vídeo.
        await sock.sendMessage(jid, { text: `✅ Download concluído! Enviando o vídeo...`, edit: sentMsg.key });

        // O vídeo final é enviado como uma nova mensagem, pois não podemos editar texto para vídeo.
        await sock.sendMessage(jid, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            fileName: `${videoTitulo || 'video'}.mp4`,
            caption: `🎥 Aqui está seu vídeo: *${videoTitulo}*`
        }, { quoted: msg });

    } catch (err) {
        await react('❌');
        console.error('Erro na função downloadYoutubeVideo:', err.message);
        // NOVO: Se a mensagem de status já foi enviada, edita ela com o erro.
        // Se não, envia uma nova mensagem de erro.
        const errorMessage = '❌ Erro ao processar sua solicitação. Verifique o link/nome ou tente novamente.';
        if (sentMsg) {
            await sock.sendMessage(jid, { text: errorMessage, edit: sentMsg.key });
        } else {
            await sock.sendMessage(jid, { text: errorMessage }, { quoted: msg });
        }
    }
};

// Nenhuma mudança necessária aqui
const command = async (sock, m, jid, args = []) => {
    const q = args.join(' ').trim();
    if (!q) {
        return sock.sendMessage(jid, { text: '📌 Use: .ytmp4 <nome da música> ou <link do YouTube>' }, { quoted: m });
    }
    await downloadYoutubeVideo(sock, m, jid, q);
};

module.exports = {
    command,
    downloadYoutubeVideo
};