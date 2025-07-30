// ARQUIVO: commands/mute2.js

const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const AUTO_DELETE_PATH = path.resolve(__dirname, '../json/auto_delete_members.json');

// Função para ler o arquivo
async function readAutoDeleteConfig() {
    try {
        const data = await fs.readFile(AUTO_DELETE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeAutoDeleteConfig({});
            return {};
        }
        console.error('Erro ao ler auto_delete_members.json:', error);
        return {};
    }
}

// Função para escrever no arquivo
async function writeAutoDeleteConfig(config) {
    try {
        await fs.writeFile(AUTO_DELETE_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever auto_delete_members.json:', error);
    }
}

// Função principal do comando
module.exports = async (sock, m, jid, args, command) => {
    try {
        let targetMemberId = null;

        // Identifica o alvo (por menção ou resposta)
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetMemberId = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            targetMemberId = m.message.extendedTextMessage.contextInfo.participant;
        }

        if (!targetMemberId) {
            const cmdName = command === 'mute2' ? 'mutar (modo apagar)' : 'desmutar (modo apagar)';
            const usageMessage = `❌ *Uso inválido.*\n\n` +
                                 `Para ${cmdName} um membro, você precisa *marcar* ou *responder* à mensagem dele.\n\n` +
                                 `*Exemplo:*\n` +
                                 `\`${PREFIX}${command} @membro\``;
            return sock.sendMessage(jid, { text: usageMessage }, { quoted: m });
        }

        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (targetMemberId === botId) {
            return sock.sendMessage(jid, { text: '❌ Não posso fazer isso comigo mesmo.' }, { quoted: m });
        }

        const autoDeleteConfig = await readAutoDeleteConfig();

        if (!autoDeleteConfig[jid]) {
            autoDeleteConfig[jid] = [];
        }

        const isMarked = autoDeleteConfig[jid].includes(targetMemberId);

        if (command === 'mute2') {
            if (isMarked) {
                return sock.sendMessage(jid, { text: '⚠️ Este membro já está com as mensagens sendo apagadas.' }, { quoted: m });
            }
            autoDeleteConfig[jid].push(targetMemberId);
            await writeAutoDeleteConfig(autoDeleteConfig);
            await sock.sendMessage(jid, { text: `✅ Membro @${targetMemberId.split('@')[0]} marcado. Todas as mensagens que ele enviar serão *apagadas* pelo bot.`, mentions: [targetMemberId] }, { quoted: m });
        } else if (command === 'unmute2') {
            if (!isMarked) {
                return sock.sendMessage(jid, { text: '⚠️ Este membro não está na lista de auto-deleção.' }, { quoted: m });
            }
            autoDeleteConfig[jid] = autoDeleteConfig[jid].filter(id => id !== targetMemberId);
            await writeAutoDeleteConfig(autoDeleteConfig);
            await sock.sendMessage(jid, { text: `✅ Membro @${targetMemberId.split('@')[0]} desmarcado. Suas mensagens não serão mais apagadas.`, mentions: [targetMemberId] }, { quoted: m });
        }

    } catch (e) {
        console.error(`Erro no comando ${command}:`, e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar o comando.' }, { quoted: m });
    }
};

// Exporta a função de leitura para ser usada em outros arquivos
module.exports.readAutoDeleteConfig = readAutoDeleteConfig;