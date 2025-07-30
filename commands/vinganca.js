// commands/vinganca.js

const fs = require('fs').promises;
const path = require('path');
const { readCoins, writeCoins } = require('../utils/coin_manager');

const REVENGE_PATH = path.resolve(__dirname, '../json/revenge_targets.json');
const REVENGE_WINDOW_SECONDS = 90; // A vítima tem 90 segundos para se vingar

const readRevengeTargets = async () => { try { const d=await fs.readFile(REVENGE_PATH,'utf8');return JSON.parse(d);}catch{return{};}};
const writeRevengeTargets = async (data) => { await fs.writeFile(REVENGE_PATH, JSON.stringify(data, null, 2)); };
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const command = async (sock, m, jid) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });
    const senderId = m.key.participant || m.key.remoteJid;

    try {
        const revengeTargets = await readRevengeTargets();
        const revengeInfo = revengeTargets[senderId];

        // 1. Validações
        if (!revengeInfo) {
            return reply('Você não tem ninguém para se vingar no momento.');
        }

        const timeSinceRobbery = (Date.now() - revengeInfo.timestamp) / 1000;
        if (timeSinceRobbery > REVENGE_WINDOW_SECONDS) {
            delete revengeTargets[senderId];
            await writeRevengeTargets(revengeTargets);
            return reply('A oportunidade de vingança expirou! Você demorou demais.');
        }

        const originalRobberId = revengeInfo.from;

        // 2. Consome a oportunidade de vingança para não ser usada de novo
        delete revengeTargets[senderId];
        await writeRevengeTargets(revengeTargets);

        // 3. Lógica da Vingança
        await sock.sendMessage(jid, { react: { text: '⚔️', key: m.key } });
        const statusMsg = await sock.sendMessage(jid, { text: `*${m.pushName}* partiu para a vingança contra @${originalRobberId.split('@')[0]}!`, mentions: [originalRobberId] }, { quoted: m });

        await delay(3000);

        const successChance = 0.60; // Chance de sucesso na vingança é maior (60%)
        const didSucceed = Math.random() < successChance;
        const coinsData = await readCoins();
        let finalMessage = '';

        if (didSucceed) {
            const robberCoins = coinsData[originalRobberId] || 0;
            if (robberCoins < 50) {
                finalMessage = `✅ *VINGANÇA COMPLETA!* ✅\n\nVocê encurralou @${originalRobberId.split('@')[0]}, mas ele(a) estava sem nada nos bolsos. Pelo menos a honra foi restaurada!`;
            } else {
                const stolenAmount = Math.floor(robberCoins * 0.15); // Pega 15% de volta
                coinsData[senderId] = (coinsData[senderId] || 0) + stolenAmount;
                coinsData[originalRobberId] -= stolenAmount;
                finalMessage = `✅ *VINGANÇA COMPLETA!* ✅\n\nVocê recuperou o que é seu e ainda levou *${stolenAmount} moedas* de @${originalRobberId.split('@')[0]}!`;
            }
            await sock.sendMessage(jid, { react: { text: '🎉', key: m.key } });
        } else {
            const penalty = 50; // Perde 50 moedas fixas se a vingança falhar
            coinsData[senderId] = Math.max(0, (coinsData[senderId] || 0) - penalty);
            finalMessage = `❌ *VINGANÇA FRACASSADA!* ❌\n\nNa sua fúria, você não prestou atenção e perdeu *${penalty} moedas*. @${originalRobberId.split('@')[0]} escapou ileso(a).`;
            await sock.sendMessage(jid, { react: { text: '🤦', key: m.key } });
        }

        await writeCoins(coinsData);
        await sock.sendMessage(jid, { text: finalMessage, mentions: [senderId, originalRobberId], edit: statusMsg.key });

    } catch (e) {
        console.error("Erro no comando vinganca:", e);
        reply('❌ Ocorreu um erro inesperado durante a sua vingança.');
    }
};

module.exports = command;