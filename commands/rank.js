// commands/rank.js

const { getAllXpData, getXpNeededForLevel } = require('../utils/xp_manager');
const { readCoins } = require('../utils/coin_manager');
const { PREFIX } = require('../config');

module.exports = async (sock, m, jid, args, senderId) => { // Adicionado senderId
    try {
        await sock.sendMessage(jid, { react: { text: '🏆', key: m.key } });

        const type = args[0]?.toLowerCase() || 'xp';

        const allXpData = await getAllXpData();
        const allCoinsData = await readCoins();
        
        let sortedUsers;
        let rankMessage = '';
        let rankTitle = '';
        let userRankString = '';
        const mentions = [];

        if (type === 'moedas' || type === 'coins') {
            rankTitle = `*🪙 Ranking de Moedas (TOP 10) 🪙*`;
            sortedUsers = Object.keys(allCoinsData)
                .map(id => ({ id, coins: allCoinsData[id] || 0 }))
                .sort((a, b) => b.coins - a.coins);

            if (sortedUsers.length === 0) return sock.sendMessage(jid, { text: '📊 Ninguém ainda tem moedas.' }, { quoted: m });
            
            rankMessage = `${rankTitle}\n\n`;
            sortedUsers.slice(0, 10).forEach((user, i) => {
                const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                rankMessage += `${emoji} @${user.id.split('@')[0]} - *${user.coins.toLocaleString('pt-BR')}* moedas\n`;
                mentions.push(user.id);
            });

            // --- MELHORIA 1: Procura e adiciona a posição do usuário ---
            const userRankIndex = sortedUsers.findIndex(u => u.id === senderId);
            if (userRankIndex !== -1 && userRankIndex >= 10) { // Se o usuário não estiver no top 10
                const userRank = sortedUsers[userRankIndex];
                userRankString = `\n---\n*Sua Posição:*\n${userRankIndex + 1}. @${userRank.id.split('@')[0]} - *${userRank.coins.toLocaleString('pt-BR')}* moedas`;
                mentions.push(senderId);
            }

        } else { // Padrão é XP
            rankTitle = `*🏆 Ranking de Nível & XP (TOP 10) 🏆*`;
            sortedUsers = Object.keys(allXpData)
                .map(id => ({ id, ...allXpData[id] }))
                .sort((a, b) => (b.level - a.level) || (b.xp - a.xp));

            if (sortedUsers.length === 0) return sock.sendMessage(jid, { text: '📊 Ninguém ainda ganhou XP.' }, { quoted: m });

            rankMessage = `${rankTitle}\n\n`;
            sortedUsers.slice(0, 10).forEach((user, i) => {
                const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                const userTitle = user.title ? ` _(${user.title})_` : '';

                // --- MELHORIA 2: Barra de Progresso de XP ---
                const xpForNextLevel = getXpNeededForLevel(user.level + 1);
                const progressPercent = Math.floor((user.xp / xpForNextLevel) * 100);
                const progress = Math.floor(progressPercent / 10);
                const progressBar = "█".repeat(progress) + "░".repeat(10 - progress);

                rankMessage += `${emoji} @${user.id.split('@')[0]}${userTitle}\n` +
                               `  *Nível:* ${user.level} | \`${progressBar}\` *${progressPercent}%*\n\n`;
                mentions.push(user.id);
            });

            // --- MELHORIA 1: Procura e adiciona a posição do usuário ---
            const userRankIndex = sortedUsers.findIndex(u => u.id === senderId);
            if (userRankIndex !== -1 && userRankIndex >= 10) {
                const userRank = sortedUsers[userRankIndex];
                const xpForNextLevel = getXpNeededForLevel(userRank.level + 1);
                const progressPercent = Math.floor((userRank.xp / xpForNextLevel) * 100);

                userRankString = `\n---\n*Sua Posição:*\n${userRankIndex + 1}. @${userRank.id.split('@')[0]} - *Nível ${userRank.level}* (${progressPercent}% para o próximo)`;
                mentions.push(senderId);
            }
        }
        
        await sock.sendMessage(jid, { text: rankMessage.trim() + userRankString, mentions: [...new Set(mentions)] }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando rank:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao obter o ranking.' }, { quoted: m });
    }
};