// commands/xpdebug.js

const { getUserXp, getXpNeededForLevel } = require('../utils/xp_manager');
const { OWNER_JID } = require('../config');

module.exports = async (sock, m, jid) => {
    // Comando restrito ao dono para evitar spam
    const sender = m.key.participant || m.key.remoteJid;
    if (sender !== OWNER_JID) {
        return;
    }

    try {
        const userData = await getUserXp(sender);
        const currentLevel = userData.level;
        const currentXp = userData.xp;

        const xpForNextLevel = getXpNeededForLevel(currentLevel + 1);
        const xpForCurrentLevel = getXpNeededForLevel(currentLevel);

        let debugMessage = `*🛠️ DEBUG DE XP 🛠️*\n\n` +
                           `*Seu Nível Atual:* ${currentLevel}\n` +
                           `*Seu XP Total:* ${currentXp}\n\n` +
                           `*Cálculo da Função getXpNeededForLevel():*\n` +
                           `*XP para Nível ${currentLevel} (atual):* ${xpForCurrentLevel}\n` +
                           `*XP para Nível ${currentLevel + 1} (próximo):* ${xpForNextLevel}\n\n` +
                           `*Cálculo do .level:*\n` +
                           `(${xpForNextLevel}) - (${currentXp}) = *${xpForNextLevel - currentXp}*`;

        await sock.sendMessage(jid, { text: debugMessage }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando xpdebug:", e);
        await sock.sendMessage(jid, { text: '❌ Erro ao rodar o debug.' }, { quoted: m });
    }
};