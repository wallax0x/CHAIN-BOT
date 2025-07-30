// commands/wiki.js (VERSÃO SEM MÓDULOS NOVOS)
const axios = require('axios'); // Usa o axios que já temos
const { PREFIX } = require('../config');

const command = async (sock, m, jid, args) => {
    const query = args.join(' ');

    if (!query) {
        const helpMsg = `📖 O que você quer pesquisar na Wikipédia?\n\n*Exemplo:* \`${PREFIX}wiki Brasil\``;
        return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
    }

    let sentMsg = null;

    try {
        await sock.sendMessage(jid, { react: { text: '📚', key: m.key } });
        sentMsg = await sock.sendMessage(jid, { text: `Ok! Pesquisando por *"${query}"* na Wikipédia...` }, { quoted: m });
        
        // Constrói a URL para a API da Wikipédia em Português
        const apiUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&redirects=1&titles=${encodeURIComponent(query)}`;
        
        // Faz a chamada com o axios
        const response = await axios.get(apiUrl);
        
        // Processa a resposta JSON da API
        const pages = response.data.query.pages;
        const pageId = Object.keys(pages)[0]; // Pega o ID da primeira página encontrada

        // Se o pageId for -1, o artigo não existe
        if (pageId === '-1') {
            throw new Error(`Artigo não encontrado para "${query}".`);
        }

        const article = pages[pageId];
        const summary = article.extract;
        const title = article.title;

        if (!summary) {
            throw new Error(`Nenhum resumo encontrado para "${query}".`);
        }
        
        // Monta a mensagem final
        const finalMessage = `
*📖 Resultado da Wikipédia para: "${title}"*

${summary.substring(0, 700)}...

*Fonte:* https://pt.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}
        `.trim();
        
        // Edita a mensagem de "pesquisando" com o resultado final
        await sock.sendMessage(jid, { text: finalMessage, edit: sentMsg.key });

    } catch (e) {
        console.error("Erro no comando wiki:", e);
        const errorMsg = `❌ Desculpe, não encontrei nenhum resultado para *"${query}"* na Wikipédia. Tente ser mais específico.`;
        if (sentMsg?.key) {
            await sock.sendMessage(jid, { text: errorMsg, edit: sentMsg.key });
        } else {
            await sock.sendMessage(jid, { text: errorMsg }, { quoted: m });
        }
    }
};

module.exports = command;