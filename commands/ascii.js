// commands/ascii.js (Versão Final e Corrigida)
const figlet = require('figlet');
const { PREFIX } = require('../config');

const command = async (sock, m, jid, args) => {
    const text = args.join(' ');

    if (!text) {
        const helpMsg = `✍️ Qual texto você quer transformar em arte ASCII?\n\n*Exemplo:* \`${PREFIX}ascii Meu Nome\``;
        return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
    }

    if (text.length > 20) {
        return sock.sendMessage(jid, { text: '❌ O texto é muito longo! Tente algo com menos de 20 caracteres.' }, { quoted: m });
    }

    try {
        await sock.sendMessage(jid, { react: { text: '🎨', key: m.key } });

        // A função figlet para criar a arte em banner
        figlet.text(text, {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default',
            width: 80,
            whitespaceBreak: true
        }, function(err, data) {
            if (err) {
                console.error('Erro no figlet:', err);
                sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao gerar a arte ASCII.' }, { quoted: m });
                return;
            }
            
            // --- A PARTE "ENFEITADA" ---
            let finalMessage = '╭───⌈ 🎨 *ARTE ASCII* ⌋\n';
            finalMessage += '│\n';
            // Adiciona a arte do figlet dentro de um bloco de código para manter a formatação
            finalMessage += `\`\`\`${data}\`\`\`\n`;
            finalMessage += '│\n';
            finalMessage += '╰───────────────';

            // Envia a mensagem final já com a moldura
            sock.sendMessage(jid, { text: finalMessage }, { quoted: m });
        });

    } catch (e) {
        console.error("Erro geral no comando ascii:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro inesperado.' }, { quoted: m });
    }
};

module.exports = command;