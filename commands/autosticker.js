// Assumindo que o nome do arquivo seja 'autosticker.js'

// ✅ Usando fs.promises para operações assíncronas (não bloqueantes)
const fsp = require('fs').promises;
const path = require('path');

const AUTOSTICKER_PATH = path.join(__dirname, '..', 'json', 'autosticker.json');

// ✅ Funções de leitura/escrita mais seguras
const readAutostickerConfig = async () => {
    try {
        const data = await fsp.readFile(AUTOSTICKER_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Se o arquivo não existir ou der erro, retorna um array vazio
        return [];
    }
};

const writeAutostickerConfig = async (data) => {
    // Escreve os dados no arquivo
    await fsp.writeFile(AUTOSTICKER_PATH, JSON.stringify(data, null, 2));
};


const command = async (sock, m, jid) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    if (!jid.endsWith('@g.us')) {
        return reply('❌ Este comando só pode ser usado em grupos.');
    }

    // ✅ Envolvido em um try...catch para segurança
    try {
        const admins = (await sock.groupMetadata(jid)).participants
            .filter(p => p.admin !== null)
            .map(p => p.id);
        const sender = m.key.participant || m.key.remoteJid;

        if (!admins.includes(sender)) {
            return reply('❌ Apenas administradores podem usar este comando.');
        }

        const autostickerGroups = await readAutostickerConfig();
        const isCurrentlyEnabled = autostickerGroups.includes(jid);

        if (isCurrentlyEnabled) {
            // Desativa: remove o JID do grupo da lista
            const updatedGroups = autostickerGroups.filter(g => g !== jid);
            await writeAutostickerConfig(updatedGroups);
            await sock.sendMessage(jid, { react: { text: '⚫', key: m.key } });
            await reply('✅ Autosticker *desativado* neste grupo.');
        } else {
            // Ativa: adiciona o JID do grupo à lista
            autostickerGroups.push(jid);
            await writeAutostickerConfig(autostickerGroups);
            await sock.sendMessage(jid, { react: { text: '🟢', key: m.key } });
            await reply('✅ Autosticker *ativado*! Agora toda imagem/vídeo curto vira figurinha automaticamente.');
        }

    } catch (e) {
        console.error("Erro no comando autosticker:", e);
        reply('❌ Ocorreu um erro ao configurar o autosticker.');
    }
};

module.exports = command;