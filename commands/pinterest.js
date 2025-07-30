// comandos/pinterest.js
const axios = require('axios');
const { API_KEY } = require('../config');

const command = async (sock, m, jid, args, prefix, commandName) => {
    const query = args.join(' ').trim();

    if (!query) {
        return sock.sendMessage(jid, {
            text: `🔍 Exemplo: *${prefix + commandName} naruto*`
        }, { quoted: m });
    }

    try {
        const url = `https://api.bronxyshost.com.br/api-bronxys/pinterest?nome=${encodeURIComponent(query)}&apikey=${API_KEY}`;
        const response = await axios.get(url);

        if (response.status !== 200 || !Array.isArray(response.data) || response.data.length === 0) {
            return sock.sendMessage(jid, {
                text: '❌ Nenhuma imagem encontrada.'
            }, { quoted: m });
        }

        const imagens = response.data;
        const randomImage = imagens[Math.floor(Math.random() * imagens.length)];

        if (!randomImage || typeof randomImage !== 'string') {
            return sock.sendMessage(jid, {
                text: '⚠️ A imagem retornada é inválida.'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            image: { url: randomImage },
            caption: `🖼️ Resultado para: *${query}*`
        }, { quoted: m });

    } catch (error) {
        console.error('[pinterest] Erro:', error?.response?.data || error.message);
        await sock.sendMessage(jid, {
            text: '❌ Ocorreu um erro ao buscar imagem do Pinterest. Tente novamente mais tarde.'
        }, { quoted: m });
    }
};

module.exports = command;
