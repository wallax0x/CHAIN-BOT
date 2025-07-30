// home/container/commands/tiktok.js

const { API_KEY } = require('../config');

/**
 * Função principal que baixa um vídeo do TikTok.
 * @param {any} sock - A instância da conexão Baileys.
 * @param {any} msg - O objeto da mensagem original para responder.
 * @param {string} jid - O JID (ID do chat) para enviar a mensagem.
 * @param {string} url - O link do TikTok para baixar.
 */
const downloadTiktokVideo = async (sock, msg, jid, url) => {
    const react = async (emoji) => {
        await sock.sendMessage(jid, { react: { text: emoji, key: msg.key } });
    };

    let statusMsg;

    try {
        await react('🤔');
        statusMsg = await sock.sendMessage(jid, { text: '📲 Processando seu link do TikTok...' }, { quoted: msg });

        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/tiktok?url=${encodeURIComponent(url)}&apikey=${API_KEY}`;
        
        await react('✅');
        await sock.sendMessage(jid, { text: '✅ Link processado! Enviando o vídeo...', edit: statusMsg.key });

        // Envia o vídeo diretamente, deixando o Baileys lidar com o download da URL da API
        await sock.sendMessage(jid, {
            video: { url: apiUrl },
            mimetype: 'video/mp4',
            caption: 'Aqui está seu vídeo do TikTok! ✨'
        }, { quoted: msg });

    } catch (e) {
        await react('❌');
        console.error("Erro ao baixar do TikTok:", e);
        const errorMessage = '❌ Falha no download. O link pode ser inválido, o vídeo pode ser privado ou a API pode estar offline.';
        if (statusMsg) {
            await sock.sendMessage(jid, { text: errorMessage, edit: statusMsg.key });
        } else {
            await sock.sendMessage(jid, { text: errorMessage }, { quoted: msg });
        }
    }
};

// Esta parte continua sendo o comando que responde ao prefixo
const command = async (sock, m, jid, args, PREFIX) => {
    const url = args[0];
    if (!url || !url.includes('tiktok')) {
        return sock.sendMessage(jid, { text: `❓ Por favor, envie um link válido do TikTok.\n\nExemplo: \`${PREFIX}tiktok https://vm.tiktok.com/...\`` }, { quoted: m });
    }
    await downloadTiktokVideo(sock, m, jid, url);
};

// Exportamos as duas funções para serem usadas em outros lugares
module.exports = {
    command,
    downloadTiktokVideo
};