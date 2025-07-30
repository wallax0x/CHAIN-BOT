// commands/filme.js
const axios = require('axios');
const { TMDB_API_KEY, PREFIX } = require('../config');

const command = async (sock, m, jid, args) => {
    const query = args.join(' ');

    if (!query) {
        const helpMsg = `🎬 O que você quer pesquisar?\n\n*Exemplo:* \`${PREFIX}filme Interestelar\``;
        return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
    }

    let sentMsg = null;

    try {
        await sock.sendMessage(jid, { react: { text: '🎬', key: m.key } });
        sentMsg = await sock.sendMessage(jid, { text: `Ok! Buscando por *"${query}"*...` }, { quoted: m });

        // --- Chamada para a API do TMDB ---
        // Usamos o endpoint 'search/multi' que busca por filmes e séries ao mesmo tempo
        const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl);
        const result = response.data.results[0]; // Pega o primeiro e mais relevante resultado

        if (!result) {
            throw new Error(`Nenhum resultado encontrado para "${query}".`);
        }

        // --- Montagem da Mensagem de Resposta ---
        const title = result.title || result.name;
        const releaseDate = new Date(result.release_date || result.first_air_date).toLocaleDateString('pt-BR');
        const rating = result.vote_average.toFixed(1);
        const overview = result.overview || 'Sinopse não disponível.';
        const mediaType = result.media_type === 'tv' ? 'Série de TV' : 'Filme';
        const posterUrl = `https://image.tmdb.org/t/p/w500${result.poster_path}`;

        // Cria a barra de estrelas para a avaliação
        const stars = '⭐'.repeat(Math.round(rating / 2)) + '☆'.repeat(5 - Math.round(rating / 2));

        const caption = `
*${title}* (${mediaType})

*Lançamento:* ${releaseDate}
*Avaliação:* ${rating} / 10 (${stars})

*Sinopse:*
_${overview}_
        `.trim();

        await sock.sendMessage(jid, { text: '✅ Encontrado!', edit: sentMsg.key });
        await sock.sendMessage(jid, {
            image: { url: posterUrl },
            caption: caption
        }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando filme:", e);
        const errorMsg = `❌ Desculpe, não encontrei nenhum resultado para *"${query}"*. Tente ser mais específico.`;
        if (sentMsg?.key) {
            await sock.sendMessage(jid, { text: errorMsg, edit: sentMsg.key });
        } else {
            await sock.sendMessage(jid, { text: errorMsg }, { quoted: m });
        }
    }
};

module.exports = command;