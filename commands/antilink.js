// commands/antilink.js

const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const CONFIG_PATH = path.resolve(__dirname, '../json/antilink_config.json');

// Funções auxiliares para ler e escrever na configuração
async function readAntiLinkConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(CONFIG_PATH, JSON.stringify({}));
            return {};
        }
        return {};
    }
}

async function writeAntiLinkConfig(config) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// O comando principal
const command = async (sock, m, jid, args) => {
    const option = args[0]?.toLowerCase();

    if (option !== 'on' && option !== 'off') {
        return sock.sendMessage(jid, { text: `❓ Uso incorreto. Utilize \`${PREFIX}antilink on\` ou \`${PREFIX}antilink off\`.` }, { quoted: m });
    }

    const config = await readAntiLinkConfig();

    if (option === 'on') {
        if (config[jid]?.enabled) {
            return sock.sendMessage(jid, { text: '⚠️ O sistema Anti-Link já está ativado neste grupo.' }, { quoted: m });
        }
        config[jid] = { enabled: true };
        await writeAntiLinkConfig(config);
        await sock.sendMessage(jid, { text: '✅ Sistema Anti-Link ativado! Membros comuns que enviarem links serão removidos.' }, { quoted: m });
    } else { // option === 'off'
        if (!config[jid]?.enabled) {
            return sock.sendMessage(jid, { text: '⚠️ O sistema Anti-Link já está desativado.' }, { quoted: m });
        }
        config[jid].enabled = false;
        await writeAntiLinkConfig(config);
        await sock.sendMessage(jid, { text: '❌ Sistema Anti-Link desativado.' }, { quoted: m });
    }
};

// Exporta a função de leitura para ser usada no listener
module.exports = command;
module.exports.readAntiLinkConfig = readAntiLinkConfig;