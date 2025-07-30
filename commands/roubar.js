// commands/roubar.js

const fs = require('fs').promises;
const path = require('path');
const { readCoins, writeCoins } = require('../utils/coin_manager');
const { getUserXp } = require('../utils/xp_manager');
const { PREFIX } = require('../config');
const { checkIfJailed, writeJailData, readJailData } = require('./pagarfianca.js');

// --- CAMINHOS E CONSTANTES ---
const DAILY_ACTIONS_PATH = path.resolve(__dirname, '../json/daily_actions.json');
const REVENGE_PATH = path.resolve(__dirname, '../json/revenge_targets.json');
const ROUBAR_LIMIT = 9;
const PENA_EM_HORAS = 12;

// --- FUNÇÕES AUXILIARES ---
const readDailyActions = async () => { try { const d=await fs.readFile(DAILY_ACTIONS_PATH,'utf8');return JSON.parse(d);}catch{return{};}};
const writeDailyActions = async (data) => { await fs.writeFile(DAILY_ACTIONS_PATH, JSON.stringify(data, null, 2)); };
const readRevengeTargets = async () => { try { const d=await fs.readFile(REVENGE_PATH,'utf8');return JSON.parse(d);}catch{return{};}};
const writeRevengeTargets = async (data) => { await fs.writeFile(REVENGE_PATH, JSON.stringify(data, null, 2)); };
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- COMANDO PRINCIPAL ---
const command = async (sock, m, jid, args) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });
    const senderId = m.key.participant || m.key.remoteJid;

    // 1. VERIFICA SE ESTÁ PRESO
    const jailStatus = await checkIfJailed(senderId);
    if (jailStatus) {
        return reply(`🚨 Você está na prisão e não pode roubar! Use \`${PREFIX}pagarfianca\` para pagar sua fiança de ${jailStatus.bailAmount} moedas.`);
    }

    // 2. VALIDAÇÕES DE ALVO
    const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const repliedTo = m.message?.extendedTextMessage?.contextInfo?.participant;
    const targetId = mentionedJid || repliedTo;

    if (!targetId) return reply(`Você precisa marcar ou responder a mensagem de quem você quer tentar roubar.\n\n*Exemplo:* \`${PREFIX}roubar @alvo\``);
    if (targetId === senderId) return reply('😂 Você não pode roubar a si mesmo, espertinho(a)!');
    if (targetId === sock.user.id.split(':')[0] + '@s.whatsapp.net') return reply('🤖 Tentar me roubar? Minha segurança é de última geração!');

    // 3. VERIFICAÇÃO DO LIMITE DIÁRIO
    const dailyActions = await readDailyActions();
    const currentDate = new Date().toISOString().slice(0, 10);
    const userActionLog = dailyActions[senderId] || { roubar: 0, date: '' };

    if (userActionLog.date === currentDate && userActionLog.roubar >= ROUBAR_LIMIT) {
        await sock.sendMessage(jid, { react: { text: '⏰', key: m.key } });
        return reply(`Você já usou suas *${ROUBAR_LIMIT}* tentativas de roubo hoje! Volte amanhã!`);
    }

    let statusMsg;
    try {
        await sock.sendMessage(jid, { react: { text: '🥷', key: m.key } });
        statusMsg = await sock.sendMessage(jid, { text: `*${m.pushName}* está se esgueirando para tentar roubar @${targetId.split('@')[0]}...`, mentions: [targetId] }, { quoted: m });
        
        try {
            const revengeTargets = await readRevengeTargets();
            revengeTargets[targetId] = { from: senderId, timestamp: Date.now() };
            await writeRevengeTargets(revengeTargets);
        } catch (e) {
            console.error("Erro ao salvar alvo de vingança:", e);
        }

        const [robberXp, victimXp, coinsData] = await Promise.all([ getUserXp(senderId), getUserXp(targetId), readCoins() ]);
        
        if (!robberXp || robberXp.xp === 0) {
            return await sock.sendMessage(jid, { text: `❌ Você precisa estar ativo no bot e ter XP para poder roubar.`, edit: statusMsg.key });
        }
        if (!victimXp || victimXp.xp === 0) {
            return await sock.sendMessage(jid, { text: `❌ O alvo não participa do sistema de economia do bot.`, edit: statusMsg.key });
        }

        if (userActionLog.date === currentDate) { userActionLog.roubar++; } 
        else { userActionLog.roubar = 1; userActionLog.date = currentDate; }
        dailyActions[senderId] = userActionLog;
        await writeDailyActions(dailyActions);
        
        await delay(3000);

        const successChance = 0.40;
        const policeChance = 0.15;
        const roll = Math.random();
        let finalMessage = '';

        if (roll < successChance) {
            await sock.sendMessage(jid, { react: { text: '🎉', key: m.key } });
            const victimCoins = coinsData[targetId] || 0;
            if (victimCoins < 20) {
                finalMessage = `✅ *Sucesso!* Mas @${targetId.split('@')[0]} é tão pobre que não tinha nada de valor para roubar. Você não levou nada.`;
            } else {
                let stolenAmount = Math.floor(victimCoins * 0.20);
                stolenAmount = Math.min(stolenAmount, 750);
                coinsData[senderId] = (coinsData[senderId] || 0) + stolenAmount;
                coinsData[targetId] -= stolenAmount;
                finalMessage = `✅ *ROUBO BEM-SUCEDIDO!* ✅\n\nVocê conseguiu roubar *${stolenAmount} moedas* 💰 de @${targetId.split('@')[0]}!`;
            }
        } else if (roll < successChance + policeChance) {
            await sock.sendMessage(jid, { react: { text: '👮', key: m.key } });
            const userLevel = robberXp.level || 1;
            const bailAmount = 150 + (userLevel * 10);
            const releaseTimestamp = Date.now() + (PENA_EM_HORAS * 60 * 60 * 1000);
            const jailData = await readJailData();
            jailData[senderId] = { isJailed: true, bailAmount, releaseTimestamp };
            await writeJailData(jailData);
            finalMessage = `🚨 *PRESO EM FLAGRANTE!* 🚨\n\nA polícia apareceu e te pegou, @${senderId.split('@')[0]}! Você foi para a prisão.\n\nVocê ficará preso por *${PENA_EM_HORAS} horas*, ou pode usar \`${PREFIX}pagarfianca\` para pagar sua fiança de *${bailAmount} moedas* e sair.`;
        } else {
            await sock.sendMessage(jid, { react: { text: '😂', key: m.key } });
            const penalty = Math.floor(Math.random() * (75 - 30 + 1)) + 30;
            if ((coinsData[senderId] || 0) >= penalty) {
                coinsData[senderId] -= penalty;
                coinsData[targetId] = (coinsData[targetId] || 0) + penalty;
                finalMessage = `❌ *ROUBO FRACASSADO!* ❌\n\nVocê tropeçou e deixou cair *${penalty} moedas* 💸, que @${targetId.split('@')[0]} pegou!`;
            } else {
                finalMessage = `❌ *ROUBO FRACASSADO!* ❌\n\nVocê tentou roubar @${targetId.split('@')[0]} mas não conseguiu nada. Pelo menos não perdeu moedas desta vez...`;
            }
        }
        
        await writeCoins(coinsData);
        await sock.sendMessage(jid, { text: finalMessage, mentions: [senderId, targetId], edit: statusMsg.key });

    } catch (e) {
        console.error("Erro no comando roubar:", e);
        if (statusMsg) await sock.sendMessage(jid, { text: '❌ Ocorreu um erro inesperado durante a tentativa de roubo.', edit: statusMsg.key });
        else reply('❌ Ocorreu um erro inesperado durante a tentativa de roubo.');
    }
};

module.exports = command;