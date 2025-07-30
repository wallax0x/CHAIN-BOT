// commands/print.js
const { API_KEY } = require('../config'); // Pega a chave da Bronxys do config

const command = async (sock, m, jid, args, PREFIX) => {
    try {
        const url = args[0];

        // Validação simples para ver se uma URL foi fornecida e se parece com uma URL
        if (!url || !url.startsWith('http')) {
            return sock.sendMessage(jid, { text: `❓ Por favor, envie uma URL válida para eu tirar o print.\n\nExemplo: \`${PREFIX}print https://google.com\`` }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `📸 Tirando print de "${url}", aguarde...` }, { quoted: m });

        // Monta a URL da API da Bronxys
        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/print_de_site?url=${encodeURIComponent(url)}&apikey=${API_KEY}`;

        // Envia a imagem diretamente usando a URL da API
        await sock.sendMessage(jid, {
            image: { url: apiUrl },
            caption: `Aqui está o print do site: ${url}`
        }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando print:", e);
        await sock.sendMessage(jid, { text: '❌ Falha ao tirar o print. A URL pode ser inválida, o site pode estar bloqueando a captura ou a API pode estar offline.' }, { quoted: m });
    }
};

module.exports = command;