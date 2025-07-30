// commands/autoresposta.js
const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

// Define o caminho para o novo arquivo de configuração
const CONFIG_PATH = path.resolve(__dirname, '../json/autoresposta_config.json');

// Funções para ler e escrever a configuração
async function readConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch { return {}; }
}
async function writeConfig(data) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(data, null, 2));
}

// Lógica do comando !autoresposta on/off
const command = async (sock, m, jid, args) => {
    try {
        const option = args[0]?.toLowerCase();
        if (option !== 'on' && option !== 'off') {
            return sock.sendMessage(jid, { text: `❓ Uso: \`${PREFIX}autoresposta on\` ou \`${PREFIX}autoresposta off\`.` }, { quoted: m });
        }
        const config = await readConfig();
        const isEnabled = config[jid] === true;

        if (option === 'on') {
            if (isEnabled) return sock.sendMessage(jid, { text: '⚠️ As auto-respostas já estão ativadas neste grupo.' }, { quoted: m });
            config[jid] = true;
            await writeConfig(config);
            await sock.sendMessage(jid, { text: '✅ Auto-respostas ativadas! O bot agora responderá a saudações.' }, { quoted: m });
        } else { // off
            if (!isEnabled) return sock.sendMessage(jid, { text: '⚠️ As auto-respostas já estão desativadas.' }, { quoted: m });
            config[jid] = false;
            await writeConfig(config);
            await sock.sendMessage(jid, { text: '❌ Auto-respostas desativadas.' }, { quoted: m });
        }
    } catch (e) {
        console.error("Erro no comando autoresposta:", e);
    }
};

// Exporta as funções para serem usadas em outros arquivos
module.exports = {
    command: command,
    readConfig: readConfig
};