// commands/antispam.js

const fs = require('fs').promises;
const path = require('path');
const { OWNER_JID, PREFIX } = require('../config');

const CONFIG_PATH = path.resolve(__dirname, '../json/antispam_config.json');

// Funções para ler e escrever na config
async function readAntiSpamConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (e) { return { enabled: false }; }
}

async function writeAntiSpamConfig(config) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

const command = async (sock, m, jid, args, senderId) => {
    // --- VERIFICAÇÃO DE PERMISSÃO: SÓ O DONO PODE USAR ---
    if (senderId !== OWNER_JID) {
        return sock.sendMessage(jid, { text: '❌ Este é um comando restrito ao dono do bot.' }, { quoted: m });
    }

    const option = args[0]?.toLowerCase();
    if (option !== 'on' && option !== 'off') {
        return sock.sendMessage(jid, { text: `❓ Uso incorreto. Utilize \`${PREFIX}antispam on\` ou \`${PREFIX}antispam off\`.` }, { quoted: m });
    }

    const config = await readAntiSpamConfig();
    const isEnabled = config.enabled;

    if (option === 'on') {
        if (isEnabled) return sock.sendMessage(jid, { text: '⚠️ O sistema Anti-Spam já está ativado.' }, { quoted: m });
        config.enabled = true;
        await writeAntiSpamConfig(config);
        await sock.sendMessage(jid, { text: '✅ Sistema Anti-Spam ativado globalmente.' }, { quoted: m });
    } else { // option === 'off'
        if (!isEnabled) return sock.sendMessage(jid, { text: '⚠️ O sistema Anti-Spam já está desativado.' }, { quoted: m });
        config.enabled = false;
        await writeAntiSpamConfig(config);
        await sock.sendMessage(jid, { text: '❌ Sistema Anti-Spam desativado globalmente.' }, { quoted: m });
    }
};

// Exporta a função de leitura para ser usada no handler
module.exports = command;
module.exports.readAntiSpamConfig = readAntiSpamConfig;