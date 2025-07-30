// commands/welcome.js (Versão Otimizada)
const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const WELCOME_CONFIG_PATH = path.resolve(__dirname, '../json/welcome_config.json');

async function readWelcomeConfig() {
    try {
        const data = await fs.readFile(WELCOME_CONFIG_PATH, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeWelcomeConfig({});
            return {};
        }
        console.error('Erro ao ler welcome_config.json:', error);
        return {};
    }
}

async function writeWelcomeConfig(config) {
    try {
        await fs.writeFile(WELCOME_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever welcome_config.json:', error);
    }
}

// O comando principal
const command = async (sock, m, jid, args) => {
    try {
        // ... (toda a sua lógica do comando 'on' e 'off' permanece exatamente a mesma aqui) ...
         if (!jid.endsWith('@g.us')) {
             return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
         }
         const action = args[0]?.toLowerCase();
         if (action !== 'on' && action !== 'off') {
             return sock.sendMessage(jid, { text: `❌ Uso incorreto. Use *${PREFIX}welcome on* ou *${PREFIX}welcome off*.` }, { quoted: m });
         }
         const config = await readWelcomeConfig();
         const groupConfig = config[jid] || { status: 0 };
         if (action === 'on') {
             if (groupConfig.status === 1) {
                 return sock.sendMessage(jid, { text: '⚠️ O sistema de boas-vindas já está ativado para este grupo.' }, { quoted: m });
             }
             config[jid] = { ...groupConfig, status: 1 };
             await writeWelcomeConfig(config);
             return sock.sendMessage(jid, { text: '✅ Sistema de boas-vindas ativado.' }, { quoted: m });
         } else if (action === 'off') {
             if (groupConfig.status === 0) {
                 return sock.sendMessage(jid, { text: '⚠️ O sistema de boas-vindas já está desativado.' }, { quoted: m });
             }
             config[jid].status = 0;
             await writeWelcomeConfig(config);
             return sock.sendMessage(jid, { text: '❌ Sistema de boas-vindas desativado.' }, { quoted: m });
         }
    } catch (e) {
        console.error('Erro no comando welcome:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro.' }, { quoted: m });
    }
};

// --- FORMA CORRETA DE EXPORTAR TUDO ---
module.exports = command; // Exporta o comando como principal
module.exports.readWelcomeConfig = readWelcomeConfig;
module.exports.writeWelcomeConfig = writeWelcomeConfig;