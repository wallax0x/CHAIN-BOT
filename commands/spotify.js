// commands/spotify.js
const { API_KEY } = require('../config'); // Pega a chave da Bronxys do config
const { PREFIX } = require('../config');

const command = async (sock, m, jid, args) => {
    try {
        const url = args[0];

        // Validação para ver se um link do Spotify foi fornecido
        if (!url || !url.includes('spotify.com')) {
            const helpMessage = `
❓ Por favor, envie um link válido de uma música do Spotify.

*Exemplo:* \`${PREFIX}spotify https://open.spotify.com/track/...\`

*Nota:* Este comando baixa apenas músicas individuais, não playlists inteiras.
            `.trim();
            return sock.sendMessage(jid, { text: helpMessage }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '🎵 Baixando sua música do Spotify, isso pode levar um momento...' }, { quoted: m });

        // Monta a URL da API da Bronxys
        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/spotify?url=${encodeURIComponent(url)}&apikey=${API_KEY}`;

        // Envia o áudio diretamente usando a URL da API
        await sock.sendMessage(jid, {
            // Importante: A API pode demorar para processar. O WhatsApp tem um limite de tempo para baixar a URL.
            // Se falhar, pode ser por esse motivo.
            audio: { url: apiUrl },
            mimetype: 'audio/mpeg'
        }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando spotify:", e);
        await sock.sendMessage(jid, { text: '❌ Falha no download. O link pode ser inválido, a música pode não estar disponível ou a API pode estar offline.' }, { quoted: m });
    }
};

module.exports = command;