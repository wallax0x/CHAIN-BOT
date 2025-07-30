// home/container/commands/instagram.js

const axios = require('axios');
const { API_KEY } = require('../config');

/**
 * Função principal que baixa conteúdo do Instagram.
 * @param {any} sock - A instância da conexão Baileys.
 * @param {any} msg - O objeto da mensagem original para responder.
 * @param {string} jid - O JID (ID do chat) para enviar a mensagem.
 * @param {string} url - O link do Instagram para baixar.
 */
const downloadInstagramContent = async (sock, msg, jid, url) => {
    const react = async (emoji) => {
        await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });
    };

    // NOVO: Variável para guardar a mensagem de status que será editada.
    let statusMsg;

    try {
        await react('🤔');
        // NOVO: Enviamos a primeira mensagem e guardamos seus dados em 'statusMsg'.
        statusMsg = await sock.sendMessage(jid, { text: '🤔 Processando seu link do Instagram...' }, { quoted: msg });

        const res = await axios.get(`https://api.bronxyshost.com.br/api-bronxys/instagram?url=${encodeURIComponent(url)}&apikey=${API_KEY}`);
        const data = res.data;

        if (!data.msg || !data.msg[0] || !data.msg[0].url) {
            await react('❓');
            // NOVO: Editamos a mensagem original para mostrar o erro.
            return await sock.sendMessage(jid, { text: '❌ Não foi possível obter o conteúdo. Verifique o link ou se o perfil é privado.', edit: statusMsg.key });
        }

        const media = data.msg[0];
        const mimeType = {
            mp4: 'video/mp4',
            webp: 'image/webp',
            jpg: 'image/jpeg',
            mp3: 'audio/mpeg'
        }[media.type] || 'video/mp4';
        
        await react('✅');
        // NOVO: Editamos a mensagem de status para mostrar o sucesso.
        await sock.sendMessage(jid, { text: '✅ Conteúdo encontrado! Enviando...', edit: statusMsg.key });
        
        // A mídia final é enviada como uma nova mensagem.
        await sock.sendMessage(jid, {
            [mimeType.split('/')[0]]: { url: media.url },
            mimetype: mimeType,
            caption: 'Aqui está seu conteúdo! ✨'
        }, { quoted: msg });

    } catch (e) {
        await react('❌');
        console.error('[instagram] Erro:', e.message);
        const errorMessage = '❌ Ocorreu um erro ao baixar o conteúdo do Instagram.';
        // NOVO: Se a mensagem de status já foi enviada, edita ela com o erro.
        if (statusMsg) {
            await sock.sendMessage(jid, { text: errorMessage, edit: statusMsg.key });
        } else {
            await sock.sendMessage(jid, { text: errorMessage }, { quoted: msg });
        }
    }
};

// Nenhuma mudança necessária aqui
const command = async (sock, m, jid, args = []) => {
    const q = args.join(' ').trim();
    if (!q || !q.includes('instagram.com')) {
        return sock.sendMessage(jid, { text: `📌 *Exemplo:* !instagram https://www.instagram.com/p/xxxxxxxx/` }, { quoted: m });
    }
    await downloadInstagramContent(sock, m, jid, q);
};

module.exports = {
    command,
    downloadInstagramContent
};