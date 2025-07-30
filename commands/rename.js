// commands/rename.js (VERSÃO COM QUALIDADE INTELIGENTE)

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker } = require('wa-sticker-formatter');

module.exports = async (sock, m, jid, args, PREFIX) => {
    try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.stickerMessage) {
            return sock.sendMessage(jid, { text: '❌ Você precisa *responder* a uma figurinha para usar este comando.' }, { quoted: m });
        }

        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, { text: `❌ *Uso inválido.*\n\nResponda a uma figurinha com:\n\n*${PREFIX}rename [NovoNomeDoPack]*\n_ou_\n*${PREFIX}rename [NovoNomeDoPack] | [NovoNomeDoAutor]*` }, { quoted: m });
        }

        const parts = query.split('|').map(part => part.trim());
        const newPackName = parts[0];
        const newAuthorName = parts[1] || '';

        if (!newPackName) {
            return sock.sendMessage(jid, { text: `❌ *Nome do Pack não fornecido.*\n\nUse o formato:\n*${PREFIX}rename [Pack] | [Autor]*` }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '✏️ Renomeando figurinha, aguarde...' }, { quoted: m });

        const stickerMessage = quoted.stickerMessage; // Pegamos a mensagem da figurinha
        const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // ✅ LÓGICA DE QUALIDADE INTELIGENTE
        const isAnimated = stickerMessage.isAnimated === true;
        const quality = isAnimated ? 50 : 85;

        const sticker = new Sticker(buffer, {
            pack: newPackName,
            author: newAuthorName,
            type: 'full',
            quality: quality // Usa a qualidade dinâmica
        });

        await sock.sendMessage(jid, { sticker: await sticker.toBuffer() }, { quoted: m });

    } catch (e) {
        // ... (seu bloco de catch continua igual) ...
        console.error('Erro no comando rename:', e);
        let errorMessage = '❌ Ocorreu um erro ao renomear a figurinha.';
        if (e.message && e.message.toLowerCase().includes('no space left on device')) {
            errorMessage = '❌ Erro: Não há espaço no armazenamento temporário do bot para processar a figurinha. Tente reiniciar o bot para limpar a memória temporária.';
        } else if (e.message.includes('Invalid sticker')) {
            errorMessage += ' Certifique-se de que a mídia respondida é uma figurinha válida.';
        } else if (e.message.includes('No message present')) {
            errorMessage += ' Não foi possível baixar a figurinha. Tente novamente.';
        }
        return sock.sendMessage(jid, { text: errorMessage }, { quoted: m });
    }
};