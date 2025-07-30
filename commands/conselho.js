// commands/conselho.js (VERSÃO FINAL COM BUSCA OFFLINE)

const axios = require('axios');
const { PREFIX } = require('../config');
const VERSICULOS_LOCAIS = require('../utils/versiculos_locais.json');
// ✅ NOVO: Carrega a Bíblia completa para busca local
const BIBLIA_COMPLETA = require('../utils/biblia_acf.json');

const command = async (sock, m, jid, args) => {
    const query = args.join(' ').trim();
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });
    
    let statusMsg;

    try {
        await sock.sendMessage(jid, { react: { text: '📖', key: m.key } });

        if (!query) {
            // --- CAMINHO 1: VERSÍCULO ALEATÓRIO (Continua com fallback local) ---
            statusMsg = await reply("Buscando um conselho de sabedoria para você...");
            let verseData;
            try {
                const apiUrl = 'https://www.abibliadigital.com.br/api/verses/acf/random';
                const response = await axios.get(apiUrl, { timeout: 7000 });
                if (!response.data || !response.data.text) throw new Error("API online falhou.");
                const { book, chapter, number, text } = response.data;
                verseData = { reference: `${book.name} ${chapter}:${number}`, text: text };
            } catch (apiError) {
                console.warn(`[Conselho] API online falhou. Usando fallback local.`);
                await sock.sendMessage(jid, { text: "A fonte online falhou... Buscando na sabedoria local! ✨", edit: statusMsg.key });
                const randomIndex = Math.floor(Math.random() * VERSICULOS_LOCAIS.length);
                verseData = VERSICULOS_LOCAIS[randomIndex];
            }
            const finalMessage = `*╔═════「 🙏 Palavra do Dia 」═════╗*\n\n` + `_"${verseData.text}"_\n\n` + `*📖 ${verseData.reference}*\n\n` + `*╚════════════════════════════╝*`;
            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
            await sock.sendMessage(jid, { text: finalMessage, edit: statusMsg.key });

        } else {
            // --- CAMINHO 2: BUSCA LOCAL NA BÍBLIA ---
            statusMsg = await reply(`Buscando por *"${query}"* em toda a Bíblia...`);
            
            const queryLowerCase = query.toLowerCase();
            const searchResults = [];
            const MAX_RESULTS = 50; // Limite para a busca não demorar demais

            for (const book of BIBLIA_COMPLETA) {
                if (searchResults.length >= MAX_RESULTS) break;
                for (let chapterNum = 0; chapterNum < book.chapters.length; chapterNum++) {
                    if (searchResults.length >= MAX_RESULTS) break;
                    for (let verseNum = 0; verseNum < book.chapters[chapterNum].length; verseNum++) {
                        const verseText = book.chapters[chapterNum][verseNum];
                        if (verseText.toLowerCase().includes(queryLowerCase)) {
                            searchResults.push({
                                reference: `${book.name} ${chapterNum + 1}:${verseNum + 1}`,
                                text: verseText
                            });
                            if (searchResults.length >= MAX_RESULTS) break;
                        }
                    }
                }
            }

            if (searchResults.length === 0) {
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
                return await sock.sendMessage(jid, { text: `❌ Não encontrei nenhum versículo contendo a palavra "${query}".`, edit: statusMsg.key });
            }

            let searchResultsMessage = `*🔎 Encontrei ${searchResults.length} versículos sobre "${query}":*\n\n`;
            const resultsToShow = searchResults.slice(0, 4); // Mostra no máximo 4

            resultsToShow.forEach(verse => {
                searchResultsMessage += `*📖 ${verse.reference}*\n_"${verse.text}"_\n\n`;
            });
            if (searchResults.length > 4) {
                searchResultsMessage += `_(Exibindo 4 de ${searchResults.length} resultados)_`;
            }
            
            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
            await sock.sendMessage(jid, { text: searchResultsMessage, edit: statusMsg.key });
        }

    } catch (e) {
        console.error("Erro final no comando conselho:", e.message);
        const errorMessage = '❌ Desculpe, ocorreu um erro inesperado ao processar sua busca.';
        if (statusMsg) {
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(jid, { text: errorMessage, edit: statusMsg.key });
        } else {
            reply(errorMessage);
        }
    }
};

module.exports = command;