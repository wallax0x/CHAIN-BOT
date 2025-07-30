const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

// AJUSTADO O CAMINHO PARA A PASTA 'json'
const MUTED_MEMBERS_PATH = path.resolve(__dirname, '../json/muted_members.json');

// Função para ler o arquivo de configuração de membros mutados
async function readMutedMembersConfig() {
    try {
        const data = await fs.readFile(MUTED_MEMBERS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') { // Se o arquivo não existe, retorna objeto vazio
            await writeMutedMembersConfig({}); // Cria o arquivo se não existir
            return {};
        }
        console.error('Erro ao ler muted_members.json:', error);
        return {};
    }
}

// Função para escrever no arquivo de configuração de membros mutados
async function writeMutedMembersConfig(config) {
    try {
        await fs.writeFile(MUTED_MEMBERS_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever muted_members.json:', error);
    }
}

module.exports = async (sock, m, jid, args, command) => {
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const groupId = jid;
        let targetMemberId = null;

        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetMemberId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            targetMemberId = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (!targetMemberId) {
            const usageMessage = `❌ *Uso inválido.*\n\n` +
                                 `Para ${command === 'mute' ? 'silenciar' : 'dessilenciar'} um membro, você precisa *marcar* ou *responder* à mensagem dele.\n\n` +
                                 `*Exemplo:*\n` +
                                 `\`${PREFIX}${command} @membro\``;
            return sock.sendMessage(jid, { text: usageMessage }, { quoted: m });
        }

        const botId = sock.user.id.includes('@s.whatsapp.net') ? sock.user.id : sock.user.id.split(':')[0] + '@s.whatsapp.net';

        if (targetMemberId === botId) {
            return sock.sendMessage(jid, { text: '❌ Não posso silenciar a mim mesmo.', quoted: m });
        }

        const mutedConfig = await readMutedMembersConfig();

        if (!mutedConfig[groupId]) {
            mutedConfig[groupId] = {};
        }

        const memberIsMuted = mutedConfig[groupId][targetMemberId] === 1;

        if (command === 'mute') {
            if (memberIsMuted) {
                return sock.sendMessage(jid, { text: '⚠️ Este membro já está silenciado.', quoted: m });
            }
            mutedConfig[groupId][targetMemberId] = 1;
            await writeMutedMembersConfig(mutedConfig);
            await sock.sendMessage(jid, { text: `✅ Membro @${targetMemberId.split('@')[0]} silenciado com sucesso. Se ele enviar uma mensagem, será removido.`, mentions: [targetMemberId], quoted: m });
        } else if (command === 'unmute') {
            if (!memberIsMuted) {
                return sock.sendMessage(jid, { text: '⚠️ Este membro não está silenciado.', quoted: m });
            }
            delete mutedConfig[groupId][targetMemberId];
            await writeMutedMembersConfig(mutedConfig);
            await sock.sendMessage(jid, { text: `✅ Membro @${targetMemberId.split('@')[0]} dessilenciado com sucesso.`, mentions: [targetMemberId], quoted: m });
        }

    } catch (e) {
        console.error('Erro no comando mute/unmute:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar o comando.', quoted: m });
    }
};

module.exports.readMutedMembersConfig = readMutedMembersConfig;
module.exports.writeMutedMembersConfig = writeMutedMembersConfig;