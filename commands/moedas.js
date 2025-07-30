// commands/moedas.js
const axios = require('axios');
const { API_KEY } = require('../config'); // Pega a chave da Bronxys do config

const command = async (sock, m, jid) => {
    try {
        await sock.sendMessage(jid, { text: '📊 Buscando as cotações mais recentes, aguarde...' }, { quoted: m });

        // Monta a URL da API da Bronxys para o serviço de moedas
        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/Moedas_Agora?apikey=${API_KEY}`;

        // Faz a chamada para a API
        const response = await axios.get(apiUrl);
        const quotes = response.data;

        // Verifica se a API retornou os dados esperados
        if (!quotes || !quotes.dolar) {
            throw new Error('A resposta da API não contém os dados de cotação esperados.');
        }

        // Formata a mensagem final com emojis para ficar mais visual
        const resultMessage = `
📈 *COTAÇÕES ATUAIS* 📉

*Moedas e Metais:*
💵 ${quotes.dolar}
💶 ${quotes.euro}
💷 ${quotes.libra}
🥇 ${quotes.ouro}

*Criptomoedas:*
🪙 ${quotes.bitcoin}
💎 ${quotes.ethereum}

*Bolsa:*
🇧🇷 ${quotes.bovespa}

_Fonte: Host API_
        `.trim();

        await sock.sendMessage(jid, { text: resultMessage }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando moedas:", e);
        await sock.sendMessage(jid, { text: '❌ Desculpe, não consegui buscar as cotações no momento. A API pode estar offline.' }, { quoted: m });
    }
};

module.exports = command;