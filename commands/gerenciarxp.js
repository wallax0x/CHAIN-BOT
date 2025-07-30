// commands/gerenciarxp.js

const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, '../json/xp_optin_config.json');

// Função para ler o arquivo de configuração
async function readXpOptinConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(CONFIG_PATH, JSON.stringify({}));
            return {};
        }
        console.error('Erro ao ler xp_optin_config.json:', error);
        return {};
    }
}

// Função para escrever no arquivo de configuração
async function writeXpOptinConfig(config) {
    try {
        await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever em xp_optin_config.json:', error);
    }
}

/**
 * Gerencia a participação do usuário no sistema de XP.
 * @param {'ativar' | 'desativar'} action - A ação a ser executada.
 */
const gerenciarXpCommand = async (sock, m, jid, senderId, action) => {
    const config = await readXpOptinConfig();
    const userIsOptedIn = config[senderId] === true;

    if (action === 'ativar') {
        if (userIsOptedIn) {
            return sock.sendMessage(jid, { text: '👍 Você já está participando do sistema de XP.' }, { quoted: m });
        }
        config[senderId] = true;
        await writeXpOptinConfig(config);
        await sock.sendMessage(jid, { text: '✅ Participação no sistema de XP **ativada**!\n\nAgora você ganhará pontos por conversar no grupo. Use o comando de rank para ver sua posição.' }, { quoted: m });

    } else if (action === 'desativar') {
        if (!userIsOptedIn) {
            return sock.sendMessage(jid, { text: '👎 Você já não estava participando do sistema de XP.' }, { quoted: m });
        }
        config[senderId] = false;
        await writeXpOptinConfig(config);
        await sock.sendMessage(jid, { text: '❌ Participação no sistema de XP **desativada**.\n\nVocê não ganhará mais pontos por mensagens.' }, { quoted: m });
    }
};

// CORREÇÃO: Exporta a função principal E a função de leitura
module.exports = gerenciarXpCommand;
module.exports.readXpOptinConfig = readXpOptinConfig;