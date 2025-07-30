// commands/apostar.js (AJUSTADO COM VERIFICAÇÃO DE PRISÃO)

const fs = require('fs').promises;
const path = require('path');
const { readCoins, writeCoins } = require('../utils/coin_manager');
const { ROLETTE_SLOTS, ANIMATION_EMOJIS } = require('../utils/cassino_config');
const { PREFIX } = require('../config');
// ✅ NOVO: Importa a função para verificar se o usuário está preso
const { checkIfJailed } = require('./pagarfianca.js'); 

// Caminhos e constantes
const BRINCADEIRAS_CONFIG_PATH = path.resolve(__dirname, '../json/brincadeiras_config.json');
const CASINO_LOG_PATH = path.resolve(__dirname, '../json/casino_logs.json');
const PLAY_LIMIT = 5;

// Funções auxiliares
const readBrincadeirasConfig = async () => { try { const d = await fs.readFile(BRINCADEIRAS_CONFIG_PATH, 'utf8'); return JSON.parse(d); } catch { return {}; } };
const readCasinoLogs = async () => { try { const d=await fs.readFile(CASINO_LOG_PATH,'utf8');return JSON.parse(d);}catch{return{};}};
const writeCasinoLogs = async (data) => { await fs.writeFile(CASINO_LOG_PATH, JSON.stringify(data, null, 2)); };
const spinRolette = () => { const t = ROLETTE_SLOTS.flatMap(s => Array(s.peso).fill(s)); const r = Math.floor(Math.random() * t.length); return t[r]; };
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const command = async (sock, m, jid, args) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    try {
        // Validação 1: Jogo ativo no grupo
        const brincadeirasConfig = await readBrincadeirasConfig();
        if (!brincadeirasConfig[jid]?.enabled) {
            return reply('🎰 O cassino está fechado neste grupo! Um admin precisa ativar as brincadeiras.');
        }

        const senderId = m.key.participant || m.key.remoteJid;

        // ✅ NOVO: VERIFICAÇÃO DE PRISÃO
        const jailStatus = await checkIfJailed(senderId);
        if (jailStatus) {
            return reply(`🚨 Você está na prisão e não pode apostar! Use \`${PREFIX}pagarfianca\` para pagar sua fiança de ${jailStatus.bailAmount} moedas.`);
        }

        // Validação 2: Limite diário de jogadas
        const casinoLogs = await readCasinoLogs();
        const currentDate = new Date().toISOString().slice(0, 10);
        const userLog = casinoLogs[senderId] || { plays: 0, date: '' };

        if (userLog.date === currentDate && userLog.plays >= PLAY_LIMIT) {
            await sock.sendMessage(jid, { react: { text: '⏰', key: m.key } });
            return reply(`Você já usou suas *${PLAY_LIMIT}* jogadas de hoje! Volte amanhã para tentar a sorte novamente.`);
        }

        // Validação 3: Valor da aposta
        const betAmountStr = args[0];
        if (!betAmountStr || isNaN(betAmountStr) || parseInt(betAmountStr) <= 0) {
            return reply(`❓ Aposta inválida! Use um número maior que zero.\n\n*Exemplo:* \`${PREFIX}apostar 50\``);
        }
        const betAmount = parseInt(betAmountStr);

        // Validação 4: Saldo do usuário
        const coinsData = await readCoins();
        const userCoins = coinsData[senderId] || 0;
        if (userCoins < betAmount) {
            return reply(`💰 Você não tem moedas suficientes! Sua aposta é de ${betAmount}, mas você só tem ${userCoins}.`);
        }
        
        // --- Lógica do Jogo ---

        // Atualiza o log de jogadas
        if (userLog.date === currentDate) { userLog.plays++; } 
        else { userLog.plays = 1; userLog.date = currentDate; }
        casinoLogs[senderId] = userLog;
        await writeCasinoLogs(casinoLogs);
        
        const remainingPlays = PLAY_LIMIT - userLog.plays;

        // Animação e resultado
        await sock.sendMessage(jid, { react: { text: '🎰', key: m.key } });
        let statusMsg = await reply(`*${m.pushName}* apostou *${betAmount} moedas* e está girando a roleta...\n\n_(Jogadas restantes hoje: ${remainingPlays})_`);
        
        for (let i = 0; i < 3; i++) {
            await delay(800);
            const randomEmojis = Array.from({ length: 3 }, () => ANIMATION_EMOJIS[Math.floor(Math.random() * ANIMATION_EMOJIS.length)]);
            await sock.sendMessage(jid, { text: `Girando... [ ${randomEmojis.join(' | ')} ]`, edit: statusMsg.key });
        }
        await delay(1000);

        const result1 = spinRolette();
        const result2 = spinRolette();
        const result3 = spinRolette();
        const finalCombination = `[ ${result1.emoji} | ${result2.emoji} | ${result3.emoji} ]`;
        
        let finalMessage = `*Roleta Parou!* 🎰\n\n${finalCombination}\n\n`;
        let totalPayout = 0;

        if (result1.emoji === result2.emoji && result2.emoji === result3.emoji) {
            totalPayout = result1.payout;
            const winnings = Math.floor(betAmount * totalPayout);
            coinsData[senderId] += winnings - betAmount;
            finalMessage += `*JACKPOT ${result1.raridade.toUpperCase()}!* 🎉\nVocê ganhou *${winnings} moedas*!\nSeu novo saldo é *${coinsData[senderId]}* 💰.`;
        } else {
            totalPayout = result2.payout;
            if (totalPayout > 0) {
                const winnings = Math.floor(betAmount * totalPayout);
                coinsData[senderId] += winnings - betAmount;
                finalMessage += `*VITÓRIA!* 🎊\nVocê ganhou *${winnings} moedas* com o emoji do meio!\nSeu novo saldo é *${coinsData[senderId]}* 💰.`;
            } else {
                coinsData[senderId] -= betAmount;
                finalMessage += `*PERDEU!* 💀\nVocê perdeu *${betAmount} moedas*.\nSeu novo saldo é *${coinsData[senderId]}* 💰.`;
            }
        }

        await writeCoins(coinsData);
        await sock.sendMessage(jid, { text: finalMessage, edit: statusMsg.key });

    } catch (e) {
        console.error("Erro no comando apostar:", e);
        reply('❌ Ocorreu um erro inesperado no cassino. Tente novamente.');
    }
};

module.exports = command;