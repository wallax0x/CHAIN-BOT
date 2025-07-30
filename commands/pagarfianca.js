// commands/pagarfianca.js (VERSÃO FINAL COM TEMPO DE PENA)

const fs = require('fs').promises;
const path = require('path');
const { readCoins, writeCoins } = require('../utils/coin_manager');
const { PREFIX } = require('../config');

// Caminho para o arquivo que armazena quem está preso
const JAIL_PATH = path.resolve(__dirname, '../json/jail.json');

// --- FUNÇÕES AUXILIARES ---
const readJailData = async () => { try { const d = await fs.readFile(JAIL_PATH, 'utf8'); return JSON.parse(d); } catch { return {}; } };
const writeJailData = async (data) => { await fs.writeFile(JAIL_PATH, JSON.stringify(data, null, 2)); };

/**
 * Verifica se um usuário está preso e se sua pena já acabou.
 * @param {string} userId - O JID do usuário a ser verificado.
 * @returns {object|false} - Retorna os dados da prisão se estiver preso, ou 'false' se estiver livre.
 */
async function checkIfJailed(userId) {
    const jailData = await readJailData();
    const userJailStatus = jailData[userId];

    // Se não está no arquivo, não está preso.
    if (!userJailStatus) {
        return false;
    }

    // ✅ VERIFICAÇÃO DE TEMPO: Se o tempo atual for maior que o tempo de soltura...
    if (Date.now() >= userJailStatus.releaseTimestamp) {
        console.log(`[JAIL] Tempo de pena de ${userId} expirou. Liberando automaticamente.`);
        delete jailData[userId]; // Libera o usuário
        await writeJailData(jailData);
        return false; // Retorna que não está mais preso
    }

    // Se o tempo ainda não acabou, retorna os dados da prisão.
    return userJailStatus;
}

// --- COMANDO PRINCIPAL ---
const command = async (sock, m, jid) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });
    const senderId = m.key.participant || m.key.remoteJid;

    try {
        // Usa a nova função inteligente para verificar o status
        const jailStatus = await checkIfJailed(senderId);

        if (!jailStatus) {
            return reply('✅ Você está livre! Não precisa pagar fiança.');
        }

        const { bailAmount, releaseTimestamp } = jailStatus;
        const coinsData = await readCoins();
        const userCoins = coinsData[senderId] || 0;

        await sock.sendMessage(jid, { react: { text: '⚖️', key: m.key } });

        if (userCoins < bailAmount) {
            const msRemaining = releaseTimestamp - Date.now();
            const hoursRemaining = (msRemaining / 1000 / 60 / 60).toFixed(1);
            return reply(`❌ Você não tem moedas suficientes para a fiança!\n\n*Fiança:* ${bailAmount} 💰\n*Seu Saldo:* ${userCoins} 💰\n\n*Tempo restante na prisão:* ${hoursRemaining} horas.`);
        }

        // Paga a fiança
        coinsData[senderId] -= bailAmount;
        const jailData = await readJailData();
        delete jailData[senderId]; // Remove o usuário da prisão

        await writeCoins(coinsData);
        await writeJailData(jailData);

        await sock.sendMessage(jid, { react: { text: '🎉', key: m.key } });
        reply(`Você pagou *${bailAmount} moedas* de fiança e agora está livre! Comporte-se.`);

    } catch (e) {
        console.error("Erro no comando pagarfianca:", e);
        reply('❌ Ocorreu um erro no sistema de fiança.');
    }
};

// Exporta tudo que outros arquivos possam precisar
module.exports = {
    command,
    checkIfJailed,
    readJailData,
    writeJailData
};