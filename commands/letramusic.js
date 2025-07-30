// commands/letra.js

const axios = require('axios');
// Garanta que sua chave de API esteja no config.js
const { API_KEY, PREFIX } = require('../config'); 

const command = async (sock, m, jid, args) => {
    // Definindo 'q' (a query) a partir dos argumentos
    const q = args.join(' ').trim();
    
    // Função auxiliar para respostas
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    // 1. Validação da entrada
    if (!q) {
        return reply(`❓ Por favor, informe o nome da música.\n\n*Exemplo:* \`${PREFIX}letra As It Was\``);
    }

    let statusMsg; // Variável para guardar a mensagem de status

    try {
        // 2. Feedback inicial com reação e mensagem de status
        await sock.sendMessage(jid, { react: { text: '🎵', key: m.key } });
        statusMsg = await sock.sendMessage(jid, { text: "🔎 Buscando a letra da música, aguarde..." }, { quoted: m });

        // 3. Chamada à API usando axios
        const response = await axios.get(`https://api.bronxyshost.com.br/api-bronxys/letra_musica?letra=${q}&apikey=${API_KEY}`);
        const apiResult = response.data;

        // 4. Validação do resultado da API
        if (!apiResult || !apiResult.letra) {
            await sock.sendMessage(jid, { react: { text: '❓', key: m.key } });
            return sock.sendMessage(jid, { text: '❌ Desculpe, não consegui encontrar a letra para essa música.', edit: statusMsg.key });
        }
        
        const { titulo, compositor, letra } = apiResult;

        // 5. Formatação da mensagem "bonita"
        const lyricsMessage = `*╔═════「 🎵 LETRA DA MÚSICA 🎵 」═════╗*\n\n` +
                              `*🎤 Título:* ${titulo}\n` +
                              `*✍️ Artista:* ${compositor}\n\n` +
                              `*──────────────────────────*\n\n` +
                              `_${letra}_\n\n` +
                              `*╚════════════════════════════╝*`;
        
        // 6. Edita a mensagem de status com o resultado final
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        await sock.sendMessage(jid, { text: lyricsMessage, edit: statusMsg.key });

    } catch (e) {
        console.error("Erro no comando letra:", e);
        // 7. Tratamento de erro aprimorado
        const errorMessage = '❌ Ocorreu um erro ao buscar a letra. A API pode estar offline ou a música não foi encontrada.';
        if (statusMsg) {
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(jid, { text: errorMessage, edit: statusMsg.key });
        } else {
            reply(errorMessage);
        }
    }
};

// Exporta a função do comando
module.exports = command;