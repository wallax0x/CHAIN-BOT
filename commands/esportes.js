// commands/esportes.js
const axios = require('axios');
const { API_KEY } = require('../config'); // Pega a chave da Bronxys do config

const command = async (sock, m, jid) => {
    try {
        await sock.sendMessage(jid, { text: '⚽ Buscando as últimas notícias do mundo dos esportes, aguarde...' }, { quoted: m });

        // Monta a URL da API da Bronxys para o serviço de notícias de esporte
        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/esporte_noticias?apikey=${API_KEY}`;

        // Faz a chamada para a API
        const response = await axios.get(apiUrl);
        const newsData = response.data;

        // Verifica se a API retornou um array com notícias
        if (!Array.isArray(newsData) || newsData.length === 0) {
            throw new Error('A resposta da API não contém uma lista de notícias.');
        }

        // Pega a imagem da primeira notícia para usar como destaque
        const imageUrl = newsData[0].img;

        // Monta a lista de títulos das notícias (começando da segunda, pois a primeira vira imagem)
        let newsList = '';
        // Usamos slice(1) para pular o primeiro item que já virou imagem de destaque
        newsData.slice(1).forEach((newsItem, index) => {
            newsList += `*${index + 1}.* ${newsItem.titulo}\n\n`;
        });
        
        const captionMessage = `
🔥 *ÚLTIMAS NOTÍCIAS - ESPORTES* 🔥

*Destaque:* ${newsData[0].titulo}

---

${newsList}
        `.trim();

        // Envia a imagem de destaque com a lista de outros títulos na legenda
        await sock.sendMessage(jid, { 
            image: { url: imageUrl },
            caption: captionMessage
        }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando esportes:", e);
        await sock.sendMessage(jid, { text: '❌ Desculpe, não consegui buscar as notícias no momento. Tente novamente mais tarde.' }, { quoted: m });
    }
};

module.exports = command;