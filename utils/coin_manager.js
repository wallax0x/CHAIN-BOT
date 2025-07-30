const fs = require('fs').promises;
const path = require('path');

const COINS_PATH = path.resolve(__dirname, '../json/coins.json');

/**
 * Lê o arquivo de moedas e retorna os dados.
 */
async function readCoins() {
    try {
        const data = await fs.readFile(COINS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeCoins({});
            return {};
        }
        console.error('Erro ao ler coins.json:', error);
        return {};
    }
}

/**
 * Escreve os dados no arquivo de moedas.
 */
async function writeCoins(coinsData) {
    try {
        await fs.writeFile(COINS_PATH, JSON.stringify(coinsData, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever em coins.json:', error);
    }
}

/**
 * Adiciona uma quantidade de moedas a um usuário.
 * @param {string} userId - O ID do usuário.
 * @param {number} amount - A quantidade de moedas a ser adicionada.
 */
async function addCoins(userId, amount) {
    const coinsData = await readCoins();
    coinsData[userId] = (coinsData[userId] || 0) + amount;
    await writeCoins(coinsData);
    console.log(`[COINS] Adicionado ${amount} moedas para ${userId}. Novo total: ${coinsData[userId]}`);
}


module.exports = {
    readCoins,
    writeCoins,
    addCoins // <-- Exportamos a nova função aqui
};