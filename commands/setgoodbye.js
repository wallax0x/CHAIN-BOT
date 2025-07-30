// commands/setgoodbye.js
const { readWelcomeConfig, writeWelcomeConfig } = require('./welcome');
const { PREFIX } = require('../config');

module.exports = async (sock, m, jid, args) => {
    try {
        const messageText = args.join(' ').trim();

        if (!messageText) {
            const helpMsg = `💬 *Definir Mensagem de Despedida*\n\n` +
                            `Use este comando para definir a mensagem que será enviada quando um membro sair do grupo.\n\n` +
                            `*Uso:*\n\`${PREFIX}setgoodbye Adeus, {membro}!\`\n\n` +
                            `*Variáveis Disponíveis:*\n` +
                            `  \`{membro}\` - Marcação do membro que saiu.\n`;
            return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
        }

        const config = await readWelcomeConfig();
        if (!config[jid]) {
            config[jid] = {}; // Cria a configuração para o grupo se não existir
        }

        config[jid].goodbyeMessage = messageText;
        await writeWelcomeConfig(config);

        await sock.sendMessage(jid, { text: '✅ Mensagem de despedida salva com sucesso!' }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando setgoodbye:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao definir a mensagem de despedida.' }, { quoted: m });
    }
};