const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

// Ajusta o caminho para a pasta 'json' (mantém o nome do arquivo JSON como adminonly_config.json)
// É mais seguro manter o nome do arquivo JSON como 'adminonly_config.json' mesmo com o comando 'soadms',
// para evitar ter que renomear o JSON e migrar dados.
const ADMINONLY_CONFIG_PATH = path.resolve(__dirname, '../json/adminonly_config.json');

// Função para ler o arquivo de configuração
async function readAdminOnlyConfig() {
    try {
        const data = await fs.readFile(ADMINONLY_CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeAdminOnlyConfig({}); // Cria o arquivo se não existir
            return {};
        }
        console.error('Erro ao ler adminonly_config.json:', error);
        return {};
    }
}

// Função para escrever no arquivo de configuração
async function writeAdminOnlyConfig(config) {
    try {
        await fs.writeFile(ADMINONLY_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever adminonly_config.json:', error);
    }
}

// O módulo principal do comando 'soadms'
module.exports = async (sock, m, jid, args) => {
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const groupId = jid;
        const action = args[0]?.toLowerCase(); // 'on' ou 'off'

        if (!action || (action !== 'on' && action !== 'off')) {
            // Mensagem de uso atualizada para 'soadms'
            return sock.sendMessage(jid, { text: `❌ Uso incorreto. Use *${PREFIX}soadms on* para ativar ou *${PREFIX}soadms off* para desativar o modo de uso exclusivo para administradores.`, quoted: m });
        }

        const config = await readAdminOnlyConfig();

        if (config[groupId] === undefined) {
            config[groupId] = false;
        }

        if (action === 'on') {
            if (config[groupId] === true) {
                return sock.sendMessage(jid, { text: '⚠️ O modo *Apenas Administradores* já está **ATIVADO** para este grupo.', quoted: m });
            }
            config[groupId] = true;
            await writeAdminOnlyConfig(config);
            return sock.sendMessage(jid, { text: '✅ Modo *Apenas Administradores* ativado para este grupo. Apenas administradores poderão usar o bot agora.', quoted: m });
        } else if (action === 'off') {
            if (config[groupId] === false) {
                return sock.sendMessage(jid, { text: '⚠️ O modo *Apenas Administradores* já está **DESATIVADO** para este grupo.', quoted: m });
            }
            config[groupId] = false;
            await writeAdminOnlyConfig(config);
            return sock.sendMessage(jid, { text: '✅ Modo *Apenas Administradores* desativado para este grupo. Todos os membros poderão usar o bot agora.', quoted: m });
        }

    } catch (e) {
        console.error('Erro no comando soadms:', e); // Log de erro ajustado
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar o comando soadms.', quoted: m });
    }
};

// Exporta a função de leitura para ser usada no handleCommand.js
module.exports.readAdminOnlyConfig = readAdminOnlyConfig;