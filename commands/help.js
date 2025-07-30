// commands/help.js

const { findCommand, helpData } = require('../utils/help_messages');
const { PREFIX } = require('../config');

const command = async (sock, m, jid, args) => {
    const commandName = args[0]?.toLowerCase();

    // Se nenhum comando for especificado, lista todos os comandos principais
    if (!commandName) {
        let response = '📖 *MENU DE AJUDA DO BOT* 📖\n\n';
        response += `Use \`${PREFIX}help [nome do comando]\` para ver detalhes.\n\n`;

        const categories = {};
        for (const cmd in helpData) {
            const category = helpData[cmd].category || 'Outros';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(cmd);
        }

        for (const category in categories) {
            response += `*━━━ ${category.toUpperCase()} ━━━*\n`;
            response += '`' + categories[category].join('`, `') + '`\n\n';
        }

        return sock.sendMessage(jid, { text: response.trim() });
    }

    // Se um comando for especificado, mostra os detalhes dele
    const cmdData = findCommand(commandName);

    if (!cmdData) {
        return sock.sendMessage(jid, { text: `❌ Comando \`${commandName}\` não encontrado. Digite \`${PREFIX}help\` para ver a lista de todos os comandos.` }, { quoted: m });
    }

    // Lógica para mostrar detalhes e subcomandos
    let response = `*Ajuda para o Módulo: ${PREFIX}${cmdData.name}*\n\n`;
    response += `*Descrição Geral:* ${cmdData.description}\n`;

    if (cmdData.aliases && cmdData.aliases.length > 0) {
        response += `*Comandos Relacionados:* \`${cmdData.aliases.join('`, `')}\`\n`;
    }

    if (cmdData.subcommands) {
        response += `\n*━━━ Comandos do Módulo ━━━*\n\n`;
        for (const subCmdName in cmdData.subcommands) {
            const subCmd = cmdData.subcommands[subCmdName];
            response += `*Comando:* \`${subCmd.usage}\`\n`;
            response += `*Função:* ${subCmd.description}\n\n`;
        }
    } else {
        response += `*Uso:* \`${cmdData.usage}\`\n`;
    }

    if (cmdData.details) {
        response += `\n*Mais Detalhes:*\n${cmdData.details}`;
    }

    await sock.sendMessage(jid, { text: response.trim() }, { quoted: m });
};

module.exports = command;