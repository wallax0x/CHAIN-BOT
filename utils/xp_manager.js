// utils/xp_manager.js (VERSÃO FINAL E CORRIGIDA)

const fs = require('fs').promises;
const path = require('path');
const { getSock } = require('./bot_instance');
const { readCoins, writeCoins } = require('./coin_manager');

const XP_DATA_PATH = path.resolve(__dirname, '../json/xp_data.json');
const COINS_PER_LEVEL_UP = 20;

// --- FUNÇÕES DE DADOS (sem alterações) ---
async function readXpData() { try{const d=await fs.readFile(XP_DATA_PATH,'utf8');return d?JSON.parse(d):{};}catch{return{};}}
async function writeXpData(data){await fs.writeFile(XP_DATA_PATH,JSON.stringify(data,null,2),'utf8');}
async function getAllXpData(){return await readXpData();}
async function setUserTitle(senderId,title){const d=await readXpData();if(!d[senderId]){d[senderId]={xp:0,level:1,title:title};}else{d[senderId].title=title;}await writeXpData(d);}
async function getUserXp(senderId) { const d = await readXpData(); return d[senderId] || { xp: 0, level: 1, title: '' }; }

function getXpNeededForLevel(level) {
    if (level <= 1) return 0;
    return 150 * Math.pow(level - 1, 2);
}

// ✅ --- FUNÇÃO addXp REFEITA E OTIMIZADA ---
async function addXp(senderId, jid, xpAmount = 15) {
    const xpData = await readXpData();
    const user = xpData[senderId] || { xp: 0, level: 1, title: '' };
    user.xp += xpAmount;

    let xpNeededForNextLevel = getXpNeededForLevel(user.level + 1);
    let hasLeveledUp = false;
    let levelsGained = 0; // Novo: Contador de níveis ganhos

    // O loop continua o mesmo, mas agora só atualiza contadores na memória
    while (user.xp >= xpNeededForNextLevel) {
        user.level++;
        levelsGained++;
        hasLeveledUp = true;
        xpNeededForNextLevel = getXpNeededForLevel(user.level + 1);
    }

    // Se o usuário subiu de nível, processamos as recompensas e a mensagem DEPOIS do loop
    if (hasLeveledUp) {
        // Calcula o total de moedas ganhas de uma só vez
        const totalCoinsGained = levelsGained * COINS_PER_LEVEL_UP;
        
        // Lê, atualiza e salva as moedas UMA ÚNICA VEZ
        const coinsData = await readCoins();
        coinsData[senderId] = (coinsData[senderId] || 0) + totalCoinsGained;
        await writeCoins(coinsData);
        
        const sock = getSock();
        if (sock) {
            // A mensagem agora mostra a recompensa correta
            const levelUpMessage = `🎉 *LEVEL UP!* 🎉\n\n` +
                                 `Parabéns, @${senderId.split('@')[0]}! Você avançou para o *Nível ${user.level}*!\n\n` +
                                 `Você ganhou *${totalCoinsGained} moedas* como recompensa! 💰`;
            
            // Aguarda o envio da mensagem para garantir que ela não se perca
            await sock.sendMessage(jid, { text: levelUpMessage, mentions: [senderId] });
        }
    }

    // Salva os dados de XP no final
    xpData[senderId] = user;
    await writeXpData(xpData);
}


module.exports = { addXp, getUserXp, getAllXpData, getXpNeededForLevel, setUserTitle, writeXpData };