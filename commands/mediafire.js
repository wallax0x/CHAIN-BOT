// commands/mediafire.js
const axios = require('axios');
const { PREFIX, API_KEY } = require('../config');

const command = async (sock, m, jid, args) => {
    const url = args[0];

    if (!url || !url.includes('mediafire.com')) {
        const helpMsg = `🔗 Por favor, envie um link válido do MediaFire.\n\n*Exemplo:* \`${PREFIX}mediafire https://www.mediafire.com/file/xyz/arquivo.zip/file\``;
        return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
    }

    let sentMsg = null;

    try {
        await sock.sendMessage(jid, { react: { text: '📥', key: m.key } });
        sentMsg = await sock.sendMessage(jid, { text: 'Ok! Acessando o link do MediaFire e preparando o download...' }, { quoted: m });
        
        // Constrói a URL da API e faz a chamada
        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/mediafire?url=${url}&apikey=${API_KEY}`;
        const response = await axios.get(apiUrl);
        
        // Verifica se a API retornou um resultado válido
        const result = response.data?.resultado?.[0];
        if (!result || !result.link) {
            throw new Error("A API não retornou um link de download válido.");
        }

        // Edita a mensagem de status com as informações do arquivo
        const infoMsg = `✅ Download preparado!\n\n*Nome:* ${result.nama}\n*Tamanho:* ${result.size}\n\nEnviando o arquivo como documento...`;
        await sock.sendMessage(jid, { text: infoMsg, edit: sentMsg.key });

        // Envia o arquivo como um documento
        await sock.sendMessage(jid, {
            document: { url: result.link },
            mimetype: 'application/octet-stream', // Mimetype genérico para qualquer tipo de arquivo
            fileName: result.nama
        }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando mediafire:", e);
        const errorMsg = '❌ Ocorreu um erro ao tentar baixar o arquivo. O link pode estar quebrado ou a API pode estar offline.';
        if (sentMsg?.key) {
            await sock.sendMessage(jid, { text: errorMsg, edit: sentMsg.key });
        } else {
            await sock.sendMessage(jid, { text: errorMsg }, { quoted: m });
        }
    }
};

module.exports = command;