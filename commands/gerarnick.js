// commands/gerarnick.js
const axios = require('axios');
const { API_KEY } = require('../config'); // Pega a chave da Bronxys do config
const { PREFIX } = require('../config');

const command = async (sock, m, jid, args) => {
    try {
        const nick = args.join(' ');

        if (!nick) {
            return sock.sendMessage(jid, { text: `✍️ Você precisa me dizer um nome para estilizar.\n\nExemplo: \`${PREFIX}gerarnick MeuNome\` `}, { quoted: m });
        }

        // --- REAÇÃO E MENSAGEM INICIAL ---
        // Reage à mensagem do usuário para dar um feedback instantâneo
        await sock.sendMessage(jid, { react: { text: '✨', key: m.key } });
        // Envia uma mensagem de "aguarde"
        await sock.sendMessage(jid, { text: `Gerando nicks estilosos para "${nick}", um momento...` }, { quoted: m });

        // Monta a URL da API da Bronxys
        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/gerar_nick?nick=${encodeURIComponent(nick)}&apikey=${API_KEY}`;
        
        // Faz a chamada para a API
        const response = await axios.get(apiUrl);
        const nicksArray = response.data;

        // Verifica se a API retornou um array
        if (!Array.isArray(nicksArray) || nicksArray.length === 0) {
            throw new Error('A resposta da API não contém uma lista de nicks.');
        }

        // --- MENSAGEM FINAL BEM FORMATADA ---
        let resultMessage = `✒️ *Nicks Gerados para "${nick}"* ✒️\n\n`;
        resultMessage += "Copie o seu favorito!\n\n";

        // Itera sobre o array e adiciona cada nick à mensagem
        nicksArray.forEach(stylizedNick => {
            resultMessage += `✨ \`\`\`${stylizedNick}\`\`\`\n`;
        });
        
        await sock.sendMessage(jid, { text: resultMessage }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando gerarnick:", e);
        await sock.sendMessage(jid, { text: '❌ Desculpe, não consegui gerar os nicks no momento. A API pode estar offline.' }, { quoted: m });
    }
};

module.exports = command;