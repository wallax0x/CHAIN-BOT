// commands/xpfix.js

const { OWNER_JID } = require('../config');
const { getAllXpData, getXpNeededForLevel, writeXpData } = require('../utils/xp_manager');

module.exports = async (sock, m, jid) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    // Comando restrito ao dono
    const sender = m.key.participant || m.key.remoteJid;
    if (sender !== OWNER_JID) {
        return reply('❌ Este comando é restrito ao dono do bot.');
    }

    try {
        await sock.sendMessage(jid, { react: { text: '🛠️', key: m.key } });
        await reply('Iniciando a correção da base de dados de XP. Isso pode levar um momento...');

        const allData = await getAllXpData();
        const userIds = Object.keys(allData);
        let usersCorrected = 0;

        for (const userId of userIds) {
            const user = allData[userId];
            let newLevel = 1;
            
            // Recalcula o nível correto baseado no XP total
            while (user.xp >= getXpNeededForLevel(newLevel + 1)) {
                newLevel++;
            }

            if (user.level !== newLevel) {
                user.level = newLevel;
                usersCorrected++;
            }
        }
        
        // Salva os dados corrigidos de volta no arquivo
        await writeXpData(allData);

        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        await reply(`*Correção Concluída!* ✅\n\n- *${userIds.length}* usuários foram verificados.\n- *${usersCorrected}* usuários tiveram seus níveis corrigidos.`);

    } catch (e) {
        console.error("Erro no comando xpfix:", e);
        await reply('❌ Ocorreu um erro durante o processo de correção.');
    }
};