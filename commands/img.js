// commands/img.js
const { API_KEY } = require('../config');
const https = require('https'); // Usa o módulo nativo do Node.js, não precisa instalar nada

const command = async (sock, m, jid, args, PREFIX) => {
    try {
        const query = args.join(' ');

        if (!query) {
            return sock.sendMessage(jid, { text: `❓ Você precisa me dizer o que buscar.\n\nExemplo: \`${PREFIX}img Gatos filhotes\`` }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `🔎 Pesquisando por imagens de "${query}", aguarde...` }, { quoted: m });

        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/google-img?nome=${encodeURIComponent(query)}&apikey=${API_KEY}`;
        
        // --- LÓGICA DE REQUISIÇÃO COM O MÓDULO 'https' ---
        const results = await new Promise((resolve, reject) => {
            https.get(apiUrl, (res) => {
                // Se o status não for 'OK' (200), rejeita a promise com um erro.
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error(`A API respondeu com o status: ${res.statusCode}`));
                }

                let data = '';
                // Começa a receber os pedaços (chunks) da resposta
                res.on('data', (chunk) => {
                    data += chunk;
                });

                // Quando a resposta terminar de chegar, processa os dados completos
                res.on('end', () => {
                    try {
                        // Tenta converter o texto da resposta para JSON
                        resolve(JSON.parse(data));
                    } catch (e) {
                        // Se a conversão falhar, rejeita a promise
                        reject(e);
                    }
                });
            }).on('error', (e) => {
                // Se houver um erro de rede, rejeita a promise
                reject(e);
            });
        });
        // --- FIM DA LÓGICA DE REQUISIÇÃO ---

        if (!results || results.length === 0) {
            return sock.sendMessage(jid, { text: `❌ Nenhuma imagem encontrada para "${query}". Tente outros termos.` }, { quoted: m });
        }

        const randomImage = results[Math.floor(Math.random() * results.length)];

        await sock.sendMessage(jid, {
            image: { url: randomImage.url },
            caption: `Aqui está uma imagem de "${query}".`
        }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando img:", e);
        await sock.sendMessage(jid, { text: '❌ Falha ao buscar a imagem. A API pode estar offline ou o termo de busca é inválido.' }, { quoted: m });
    }
};

module.exports = command;