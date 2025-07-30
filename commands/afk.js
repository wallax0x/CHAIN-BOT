// commands/afk.js

const fs = require('fs').promises;
const path = require('path');

const AFK_DATA_PATH = path.resolve(__dirname, '../json/afk_users.json');

// Funções auxiliares para ler e escrever no arquivo
async function readAfkData() {
    try {
        const data = await fs.readFile(AFK_DATA_PATH, 'utf8');
        return JSON.parse(data);
    } catch (e) { return {}; }
}

async function writeAfkData(data) {
    await fs.writeFile(AFK_DATA_PATH, JSON.stringify(data, null, 2));
}

const command = async (sock, m, jid, args, senderId) => {
    try {
        const reason = args.join(' ') || 'Não especificado'; // Motivo padrão
        const afkData = await readAfkData();

        // Marca o usuário como AFK
        afkData[senderId] = {
            reason: reason,
            time: Date.now()
        };

        await writeAfkData(afkData);

        const afkMessage = `😴 @${senderId.split('@')[0]} agora está ausente (AFK).\n*Motivo:* ${reason}`;
        await sock.sendMessage(jid, { text: afkMessage, mentions: [senderId] });

    } catch (e) {
        console.error("Erro no comando afk:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao definir seu status AFK.' }, { quoted: m });
    }
};

// Exporta a função de leitura para ser usada no listener
module.exports = command;
module.exports.readAfkData = readAfkData;
module.exports.writeAfkData = writeAfkData;