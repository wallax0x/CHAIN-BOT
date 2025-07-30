const fs = require('fs');
const path = require('path');
const { readBrincadeirasConfig } = require('./brincadeiras');
const { PREFIX } = require('../config');

const KISSES_FOLDER = path.resolve(__dirname, '..', 'assets', 'kisses');

const command = async (sock, m, jid, args, senderId) => {
    try {
        const brincadeirasConfig = await readBrincadeirasConfig();
        if (brincadeirasConfig[jid]?.enabled !== true) {
            const errorMsg = `As brincadeiras estão *desativadas*! 😴\n\nPeça para um admin usar o comando \`${PREFIX}brincadeiras on\` para liberar a pegação.`;
            return sock.sendMessage(jid, { text: errorMsg }, { quoted: m });
        }

        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        
        if (!mentionedJid) {
            const helpMsg = `💋 Para quem vai o beijo? Marque alguém!\n\n*Exemplo:* \`${PREFIX}beijar @crush\``;
            return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
        }

        if (mentionedJid === senderId) {
            return sock.sendMessage(jid, { text: 'Eita, amor próprio é tudo, mas... que tal beijar outra pessoa? 😂' }, { quoted: m });
        }
        if (mentionedJid === sock.user.id) {
            return sock.sendMessage(jid, { text: `😳 Oh! Fico todo sem jeito... mas eu sou só um programa de computador. Que tal um emoji de beijo? 😘` }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '💋', key: m.key } });

        const gifFiles = fs.readdirSync(KISSES_FOLDER).filter(file => file.endsWith('.gif'));
        if (gifFiles.length === 0) {
            return sock.sendMessage(jid, { text: '❌ Nenhum GIF de beijo encontrado na pasta de assets.' }, { quoted: m });
        }
        
        const randomGif = gifFiles[Math.floor(Math.random() * gifFiles.length)];
        const gifPath = path.join(KISSES_FOLDER, randomGif);

        const senderName = m.pushName || senderId.split('@')[0];
        const messages = [
            `*Um Beijo Roubado!* 💋\n\nNo meio da conversa, *${senderName}* não resistiu e roubou um beijo de surpresa de @${mentionedJid.split('@')[0]}!`,
            `*Clima de Romance!* ❤️‍🔥\n\nO amor está no ar! *${senderName}* puxou @${mentionedJid.split('@')[0]} para perto e deu um beijo digno de cinema!`,
            `*Que pegada!* 🔥\n\n*${senderName}* mostrou que tem atitude e deu um beijo daqueles em @${mentionedJid.split('@')[0]}!`
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        // Lê o arquivo GIF para a memória (buffer)
        const gifBuffer = fs.readFileSync(gifPath);

        // Envia o buffer diretamente, em vez do caminho do arquivo
        await sock.sendMessage(jid, {
            video: gifBuffer, // Enviando o buffer
            gifPlayback: true, // Certifique-se de que isso está definido como true
            caption: randomMessage,
            mentions: [senderId, mentionedJid]
        });

    } catch (e) {
        console.error('Erro no comando beijar:', e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao tentar executar o beijo.' }, { quoted: m });
    }
};

module.exports = command;
