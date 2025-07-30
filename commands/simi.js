// commands/simi.js

const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const CONFIG_PATH = path.resolve(__dirname, '../json/simi_config.json');

async function readConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch { return {}; }
}

async function writeConfig(data) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(data, null, 2));
}

const command = async (sock, m, jid, args) => {
    try {
        const option = args[0]?.toLowerCase();
        if (option !== 'on' && option !== 'off') {
            return sock.sendMessage(jid, { text: `❓ Uso: \`${PREFIX}simi on\` ou \`${PREFIX}simi off\`.` }, { quoted: m });
        }

        const config = await readConfig();
        const isCurrentlyEnabled = config[jid] === true; // Verifica o estado atual

        if (option === 'on') {
            // --- CORREÇÃO: Verifica se já está ativo ---
            if (isCurrentlyEnabled) {
                return sock.sendMessage(jid, { text: '⚠️ O sistema Simi já está ATIVADO neste grupo.' }, { quoted: m });
            }
            
            config[jid] = true;
            await writeConfig(config);
            await sock.sendMessage(jid, { text: '✅ Sistema de aprendizado Simi foi ATIVADO.' }, { quoted: m });

        } else { // option === 'off'
            // --- CORREÇÃO: Verifica se já está desativado ---
            if (!isCurrentlyEnabled) {
                return sock.sendMessage(jid, { text: '⚠️ O sistema Simi já está DESATIVADO neste grupo.' }, { quoted: m });
            }

            config[jid] = false;
            await writeConfig(config);
            await sock.sendMessage(jid, { text: '❌ Sistema de aprendizado Simi foi DESATIVADO.' }, { quoted: m });
        }
    } catch (e) {
        console.error("Erro no comando simi:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao configurar o sistema Simi.' }, { quoted: m });
    }
};

module.exports = {
    command: command,
    readConfig: readConfig
};