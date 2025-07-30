// commands/brincadeiras.js

const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const BRINCADEIRAS_CONFIG_PATH = path.resolve(__dirname, '../json/brincadeiras_config.json');

// Esta função auxiliar está perfeita
async function readBrincadeirasConfig() {
    try {
        const data = await fs.readFile(BRINCADEIRAS_CONFIG_PATH, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeBrincadeirasConfig({});
            return {};
        }
        return {};
    }
}

// Esta função auxiliar também está perfeita
async function writeBrincadeirasConfig(config) {
    try {
        await fs.writeFile(BRINCADEIRAS_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever brincadeiras_config.json:', error);
    }
}

// --- MUDANÇA 1: A função principal agora é uma constante chamada 'command' ---
const command = async (sock, m, jid, args) => {
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const groupId = jid;
        const action = args[0]?.toLowerCase();

        if (!action || (action !== 'on' && action !== 'off')) {
            return sock.sendMessage(jid, { text: `❌ Uso incorreto. Use ${PREFIX}brincadeiras on ou ${PREFIX}brincadeiras off.` }, { quoted: m });
        }

        const config = await readBrincadeirasConfig();
        
        // A lógica aqui estava usando 'config[groupId] === true/false'
        // Mudei para um objeto para ser mais consistente com os outros comandos
        const groupConfig = config[groupId] || { enabled: false };

        if (action === 'on') {
            if (groupConfig.enabled === true) {
                return sock.sendMessage(jid, { text: '⚠️ O modo *Brincadeiras* já está **ATIVADO** para este grupo.', quoted: m });
            }
            config[groupId] = { enabled: true };
            await writeBrincadeirasConfig(config);
            return sock.sendMessage(jid, { text: '✅ Modo *Brincadeiras* ativado! Jogos liberados!', quoted: m });
        } else if (action === 'off') {
            if (groupConfig.enabled === false) {
                return sock.sendMessage(jid, { text: '⚠️ O modo *Brincadeiras* já está **DESATIVADO** para este grupo.', quoted: m });
            }
            config[groupId] = { enabled: false };
            await writeBrincadeirasConfig(config);
            return sock.sendMessage(jid, { text: '❌ Modo *Brincadeiras* desativado.', quoted: m });
        }
    } catch (e) {
        console.error('Erro no comando brincadeiras:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar o comando.' }, { quoted: m });
    }
};

// --- MUDANÇA 2: Exportamos um objeto com as duas funções ---
// Agora o 'commandHandler' pode pegar a função 'command' de dentro deste pacote.
module.exports = {
    command: command,
    readBrincadeirasConfig: readBrincadeirasConfig
};