// commands/antifake.js
const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const CONFIG_PATH = path.resolve(__dirname, '../json/antifake_config.json');

// Funções para ler e escrever a configuração (sem alterações)
async function readConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch { return {}; }
}
async function writeConfig(data) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(data, null, 2));
}

// Lógica do comando !antifake on/off (com novo estilo)
const command = async (sock, m, jid, args) => {
    try {
        const option = args[0]?.toLowerCase();
        if (option !== 'on' && option !== 'off') {
            return sock.sendMessage(jid, { text: `❓ *Uso Incorreto!*\n\nUse \`${PREFIX}antifake on\` ou \`${PREFIX}antifake off\`.` }, { quoted: m });
        }

        // --- NOVO: Reage ao comando do admin ---
        await sock.sendMessage(jid, { react: { text: '🛡️', key: m.key } });

        const config = await readConfig();
        const isEnabled = config[jid] === true;

        if (option === 'on') {
            if (isEnabled) {
                const alreadyOnMessage = `⚠️ *Atenção!* O sistema Anti-Fake já se encontra *ativado* neste grupo.`;
                return sock.sendMessage(jid, { text: alreadyOnMessage }, { quoted: m });
            }
            config[jid] = true;
            await writeConfig(config);

            const enabledMessage = `
✅ *SISTEMA ANTI-FAKE ATIVADO* ✅

A partir de agora, o bot irá remover automaticamente qualquer número que não seja do Brasil (+55) que entrar neste grupo.
            `.trim();
            await sock.sendMessage(jid, { text: enabledMessage }, { quoted: m });

        } else { // off
            if (!isEnabled) {
                const alreadyOffMessage = `⚠️ *Atenção!* O sistema Anti-Fake já se encontra *desativado*.`;
                return sock.sendMessage(jid, { text: alreadyOffMessage }, { quoted: m });
            }
            config[jid] = false;
            await writeConfig(config);
            
            const disabledMessage = `
❌ *SISTEMA ANTI-FAKE DESATIVADO* ❌

O bot não irá mais remover números estrangeiros automaticamente.
            `.trim();
            await sock.sendMessage(jid, { text: disabledMessage }, { quoted: m });
        }
    } catch (e) {
        console.error("Erro no comando antifake:", e);
    }
    
};

// --- FORMA CORRETA DE EXPORTAR TUDO ---
module.exports = {
    command,
    readConfig // Esta linha garante que a função de leitura possa ser usada por outros arquivos.
};
