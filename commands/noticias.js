const axios = require('axios');

module.exports = async (sock, m, jid, args) => {
    try {
        const url = 'https://newsdata.io/api/1/news?country=br&language=pt&apikey=pub_06712fc51c4349e2a307fec438af0088'; // ver nota abaixo

        const response = await axios.get(url);
        const noticias = response.data.results;

        if (!noticias || noticias.length === 0) {
            return sock.sendMessage(jid, { text: '❌ Nenhuma notícia encontrada no momento.' }, { quoted: m });
        }

        let msg = `📰 *Últimas Notícias:*\n\n`;

        for (let i = 0; i < Math.min(5, noticias.length); i++) {
            msg += `${i + 1}. ${noticias[i].title}\n`;
        }

        msg += `\nFonte: ${noticias[0].source_id || 'newsdata.io'}`;

        await sock.sendMessage(jid, { text: msg }, { quoted: m });

    } catch (e) {
        console.error('[noticias] Erro:', e.message);
        await sock.sendMessage(jid, { text: '❌ Erro ao buscar notícias.' }, { quoted: m });
    }
};
