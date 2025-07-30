const https = require('https'); // Módulo nativo do Node.js para requisições HTTPS
const { PREFIX } = require('../config'); // Importa o PREFIX

module.exports = async (sock, m, jid, args, API_KEY) => { // Removido PREFIX dos parâmetros pois ele será importado aqui
    try {
        const query = args.join(' ').trim(); // Pega o signo como argumento

        if (!query) {
            return sock.sendMessage(jid, { text: `❌ Por favor, digite seu signo. Exemplo: *${PREFIX}signo virgem*` }, { quoted: m });
        }

        if (!API_KEY) {
            console.error('API_KEY não está definida para o comando signo.');
            return sock.sendMessage(jid, { text: '❌ A chave da API não está configurada corretamente no bot.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: 'AGUARDE, REALIZANDO AÇÃO.' }, { quoted: m });

        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/horoscopo?signo=${encodeURIComponent(query)}&apikey=${API_KEY}`;
        
        // --- Requisição HTTP usando o módulo 'https' nativo do Node.js ---
        let rawData = '';
        const dataPromise = new Promise((resolve, reject) => {
            https.get(apiUrl, (res) => {
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(rawData));
                    } catch (e) {
                        reject(new Error('Falha ao parsear JSON da API: ' + e.message));
                    }
                });
            }).on('error', (err) => {
                reject(new Error('Erro na requisição HTTP para a API: ' + err.message));
            });
        });

        const data = await dataPromise;

        if (data.status === false) {
            return sock.sendMessage(jid, { text: `❌ Não foi possível encontrar o horóscopo para o signo "${query}". Verifique a escrita do signo ou tente novamente.`, quoted: m });
        }
        if (!data.img || !data.title || !data.body) {
             return sock.sendMessage(jid, { text: `❌ A API não retornou os dados completos para o horóscopo de "${query}". Tente novamente mais tarde.`, quoted: m });
        }

        // Envia a imagem com a legenda (caption)
        await sock.sendMessage(jid, {
            image: { url: data.img },
            caption: `*Signo:* ${query}\n\n*${data.title}*\n${data.body}`
        }, { quoted: m }).catch(e => {
            console.error('Erro ao enviar horóscopo:', e);
            return sock.sendMessage(jid, { text: '❌ Erro ao enviar o horóscopo. Tente novamente mais tarde.' }, { quoted: m });
        });

    } catch (e) {
        console.error('Erro no comando signo:', e);
        // Trata erros de requisição ou JSON
        if (e.message.includes('requisição HTTP') || e.message.includes('parsear JSON')) {
             return sock.sendMessage(jid, { text: '❌ Erro de conexão com a API ou formato de dados inválido. Tente novamente mais tarde.' }, { quoted: m });
        }
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro inesperado ao buscar o horóscopo.' + (e.message || ''), quoted: m });
    }
};