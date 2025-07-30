// commands/abrir.js (VERSÃO FINAL SINCRONIZADA)

const fs = require('fs').promises;
const path = require('path');
const PREMIOS_DA_CAIXA = require('../utils/caixa_premios');
const { readCoins, writeCoins } = require('../utils/coin_manager');
// ✅ NOME CORRIGIDO NA IMPORTAÇÃO
const { addXp, setUserTitle } = require('../utils/xp_manager'); 

const INVENTORY_PATH = path.resolve(__dirname, '../json/inventario.json');
const readInventory = async () => { try { const d=await fs.readFile(INVENTORY_PATH,'utf8');return d?JSON.parse(d):{};}catch{return{};}};
const writeInventory = async (data) => { await fs.writeFile(INVENTORY_PATH, JSON.stringify(data, null, 2)); };

const escolherPremio = () => {
    const tabelaPonderada = PREMIOS_DA_CAIXA.flatMap(premio => Array(premio.peso).fill(premio));
    const randomIndex = Math.floor(Math.random() * tabelaPonderada.length);
    return tabelaPonderada[randomIndex];
};

module.exports = async (sock, m, jid, args) => {
    try {
        const senderId = m.key.participant || m.key.remoteJid;
        const senderName = m.pushName || 'Alguém';
        const itemParaAbrir = args[0]?.toLowerCase();

        if (itemParaAbrir !== 'caixa') {
            return sock.sendMessage(jid, { text: '❓ O que você quer abrir? Tente `.abrir caixa`.' }, { quoted: m });
        }

        const inventory = await readInventory();
        const userInventory = inventory[senderId];

        if (!userInventory || !userInventory.caixas || userInventory.caixas < 1) {
            return sock.sendMessage(jid, { text: '📦 Você não tem nenhuma Caixa Misteriosa para abrir! Compre uma na `.loja`.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🎁', key: m.key } });
        userInventory.caixas--; 

        const premio = escolherPremio();
        let coinsData = await readCoins();
        
        let responseMessage = `*${senderName} abriu uma Caixa Misteriosa e...* 🥁\n\n` +
                              `╭───⌈ *${premio.raridade.toUpperCase()}* ⌋\n` +
                              `│\n` +
                              `│ ✨ *Você encontrou: ${premio.nome}* ✨\n` +
                              `│\n`;

        switch (premio.tipo) {
            case 'moedas':
                coinsData[senderId] = (coinsData[senderId] || 0) + premio.valor;
                responseMessage += `│ 💰 *+${premio.valor} moedas* foram adicionadas à sua carteira!`;
                break;
            case 'xp':
                // ✅ NOME CORRIGIDO NA CHAMADA DA FUNÇÃO
                await addXp(senderId, jid, premio.valor); 
                responseMessage += `│ 🌟 *+${premio.valor} XP* foi adicionado à sua experiência!`;
                break;
            case 'item':
                userInventory[premio.valor] = (userInventory[premio.valor] || 0) + 1;
                responseMessage += `│ 🎟️ Um item foi adicionado ao seu inventário: *${premio.desc || premio.nome}*`;
                break;
        }

        responseMessage += `\n╰────────────────`;

        await writeInventory({ ...inventory, [senderId]: userInventory });
        await writeCoins(coinsData);
        
        await sock.sendMessage(jid, { text: responseMessage }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando abrir:', e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao tentar abrir a caixa.' }, { quoted: m });
    }
};