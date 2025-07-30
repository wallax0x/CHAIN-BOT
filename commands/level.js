// commands/level.js (VERSÃO FINAL E CORRIGIDA)

const { getUserXp, getXpNeededForLevel } = require('../utils/xp_manager');
const { readCoins } = require('../utils/coin_manager');

module.exports = async (sock, m, jid) => {
    try {
        const senderId = m.key.participant || m.key.remoteJid;
        const senderMention = `@${senderId.split('@')[0]}`;

        const userXpData = await getUserXp(senderId);
        const currentXp = userXpData.xp;
        const currentLevel = userXpData.level;
        const userTitle = userXpData.title;
        
        // ✅ CÁLCULO CORRIGIDO: Usa (currentLevel + 1)
        const xpForNextLevel = getXpNeededForLevel(currentLevel + 1);
        const xpRemaining = xpForNextLevel - currentXp;

        const coinsData = await readCoins();
        const userCoins = coinsData[senderId] || 0;

        // Mensagem de perfil mais clara
        let message = `*✨ Perfil de ${senderMention} ✨*\n\n` +
                      `*Título:* ${userTitle || 'Nenhum'}\n` +
                      `*Nível:* ${currentLevel}\n` +
                      `*Moedas:* ${userCoins} 💰\n\n` +
                      `*Progresso:* ${currentXp} / ${xpForNextLevel} XP\n` +
                      `*Faltam ${xpRemaining} XP para o Nível ${currentLevel + 1}*`;

        await sock.sendMessage(jid, { text: message, mentions: [senderId] }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando level:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao obter seu nível e XP.' }, { quoted: m });
    }
};