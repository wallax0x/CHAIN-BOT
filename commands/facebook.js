// commands/facebook.js
const { API_KEY } = require('../config');

const command = async (sock, m, jid, args, PREFIX, API_KEY_BRONXYS) => {
    try {
        const url = args[0];

        if (!url || (!url.includes("facebook.com") && !url.includes("fb.watch"))) {
            return sock.sendMessage(jid, { text: `❓ Por favor, envie um link válido do Facebook.\n\nExemplo: \`${PREFIX}facebook <link_do_video>\`` }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '📲 Baixando seu vídeo do Facebook, isso pode levar um momento...' }, { quoted: m });

        // A sua API usa o nome do comando na URL, então vamos definir 'face_video' aqui
        const apiEndpoint = 'face_video';
        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/${apiEndpoint}?url=${url}&apikey=${API_KEY}`;

        // Envia o vídeo diretamente
        await sock.sendMessage(jid, {
            video: { url: apiUrl },
            mimetype: 'video/mp4',
            caption: 'Aqui está seu vídeo do Facebook!'
        }, { quoted: m });

    } catch (e) {
        console.error("Erro ao baixar do Facebook:", e);
        await sock.sendMessage(jid, { text: '❌ Falha no download. O link pode ser inválido, o vídeo pode ser privado ou a API pode estar com problemas.' }, { quoted: m });
    }
};

module.exports = command;