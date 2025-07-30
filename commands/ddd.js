// commands/ddd.js (Com ordenação alfabética)

const axios = require('axios');
const { PREFIX } = require('../config');

module.exports = async (sock, m, jid, args) => {
    try {
        const ddd = args[0];

        if (!ddd || !/^\d{2}$/.test(ddd)) {
            await sock.sendMessage(jid, { react: { text: '❓', key: m.key } });
            return sock.sendMessage(jid, { 
                text: `Por favor, forneça um DDD válido com 2 dígitos.\n\n*Exemplo:* \`${PREFIX}ddd 21\`` 
            }, { quoted: m });
        }
        
        await sock.sendMessage(jid, { react: { text: '📞', key: m.key } });
        const statusMsg = await sock.sendMessage(jid, { text: `Buscando informações para o DDD *${ddd}*...` }, { quoted: m });

        const apiUrl = `https://brasilapi.com.br/api/ddd/v1/${ddd}`;
        const response = await axios.get(apiUrl);
        const data = response.data;
        
        // ✅ CORREÇÃO: Adicionado .sort() para ordenar as cidades em ordem alfabética
        let cityList = data.cities.sort((a, b) => a.localeCompare(b)).map(city => `\`${city}\``).join(', ');
        
        const resultMessage = `*🌎 Cidades com o DDD ${ddd} (Estado: ${data.state})*\n\n` +
                              `*Total de cidades encontradas:* ${data.cities.length}\n\n` +
                              `*Lista de Cidades (em ordem alfabética):*\n${cityList}`;

        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        await sock.sendMessage(jid, { text: resultMessage, edit: statusMsg.key });

    } catch (error) {
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        
        if (error.response && error.response.status === 404) {
            await sock.sendMessage(jid, { text: `❌ O DDD *${args[0]}* não foi encontrado.` }, { quoted: m });
        } else {
            console.error("Erro no comando ddd:", error);
            await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao consultar a API. Tente novamente mais tarde.' }, { quoted: m });
        }
    }
};