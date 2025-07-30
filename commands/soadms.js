// Arquivo: commands/soadms.js (Versão Inteligente)
const { PREFIX } = require('../config');
const fs = require('fs').promises; // Usando a versão de promessas do fs
const path = require('path');

const configPath = path.join(__dirname, '..', 'data', 'adminOnlyConfig.json');

// Função para ler a configuração (totalmente assíncrona)
async function readAdminOnlyConfig() {
    try {
        const data = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Se o arquivo não existe, retorna um objeto vazio, não é um erro fatal.
        if (error.code === 'ENOENT') {
            return {};
        }
        console.error('Erro ao ler adminOnlyConfig.json:', err);
        return {};
    }
}

// Função para salvar a configuração (totalmente assíncrona)
async function saveAdminOnlyConfig(data) {
    try {
        await fs.writeFile(configPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erro ao escrever em adminOnlyConfig.json:', error);
    }
}

// --- LÓGICA DO COMANDO ---
const command = async (sock, m, jid, args) => {
    try {
        const option = args[0]?.toLowerCase();

        // Verificação de permissão: Apenas Admins podem usar este comando
        const groupMetadata = await sock.groupMetadata(jid);
        const sender = groupMetadata.participants.find(p => p.id === m.key.participant);
        if (!sender || (sender.admin !== 'admin' && sender.admin !== 'superadmin')) {
            return sock.sendMessage(jid, { text: '❌ Apenas administradores podem usar este comando.' }, { quoted: m });
        }

        if (option !== 'on' && option !== 'off') {
            const helpMsg = `❓ *Uso Incorreto!*\n\nUse para restringir os comandos do bot apenas para admins.\n\n*Exemplos:*\n\`${PREFIX}soadms on\` (restringe o bot)\n\`${PREFIX}soadms off\` (libera o bot)`;
            return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
        }

        const config = await readAdminOnlyConfig();
        const isCurrentlyOn = config[jid] === true;

        // --- NOVA VERIFICAÇÃO DE ESTADO ---
        if (option === 'on') {
            if (isCurrentlyOn) {
                return sock.sendMessage(jid, { text: '⚠️ A trava de "só adms" já está *ativada*.' }, { quoted: m });
            }
            config[jid] = true;
            await saveAdminOnlyConfig(config);
            await sock.sendMessage(jid, { text: '✅ Trava ativada! O bot agora só responderá aos comandos de administradores neste grupo.' }, { quoted: m });
        } else { // option === 'off'
            if (!isCurrentlyOn) {
                return sock.sendMessage(jid, { text: '⚠️ A trava de "só adms" já está *desativada*.' }, { quoted: m });
            }
            config[jid] = false;
            await saveAdminOnlyConfig(config);
            await sock.sendMessage(jid, { text: '✅ Trava desativada! O bot agora responderá a todos os membros do grupo.' }, { quoted: m });
        }

    } catch (e) {
        console.error("Erro no comando soadms:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar o comando.' }, { quoted: m });
    }
};

module.exports = {
    command,
    // Renomeamos para manter o padrão e exportamos a função de leitura
    readConfig: async (groupId) => {
        const config = await readAdminOnlyConfig();
        return config[groupId] ?? false;
    }
};