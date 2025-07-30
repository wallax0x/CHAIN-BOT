const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { OWNER_JID, PREFIX } = require('../config.js');

module.exports = async (sock, m, jid, args) => {
    try {
        const sender = m.key.participant || m.key.remoteJid;

        // Verifica se quem enviou foi o dono do bot
        if (!OWNER_JID || sender.split('@')[0] !== OWNER_JID.split('@')[0]) {
            return sock.sendMessage(jid, { text: '❌ Este comando é restrito ao dono do bot.' }, { quoted: m });
        }

        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const image = quotedMsg?.imageMessage;

        if (!image) {
            return sock.sendMessage(jid, { text: `🖼️ Por favor, responda a uma imagem com o comando *${PREFIX}setbotpp*.` }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🔄', key: m.key } });

        const stream = await downloadContentFromMessage(image, 'image');
        let buffer = Buffer.from([]);

        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Atualiza a foto de perfil
        await sock.updateProfilePicture(sock.user.id, buffer);

        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        await sock.sendMessage(jid, { text: '✅ Foto de perfil do bot atualizada com sucesso!' }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando setbotpp:", e);
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        await sock.sendMessage(jid, { text: '❌ Erro ao atualizar a foto de perfil do bot.' }, { quoted: m });
    }
};
