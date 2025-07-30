const fs = require('fs').promises;
const path = require('path');

const COINS_PATH = path.resolve(__dirname, '../json/coins.json');

// Função para ler os dados de moedas
async function readCoins() {
    try {
        const data = await fs.readFile(COINS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') { // Se o arquivo não existe, retorna objeto vazio
            await writeCoins({}); // Cria o arquivo se não existir
            return {};
        }
        console.error('Erro ao ler coins.json:', error);
        return {};
    }
}

// Função para escrever os dados de moedas
async function writeCoins(coins) {
    try {
        await fs.writeFile(COINS_PATH, JSON.stringify(coins, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever coins.json:', error);
    }
}

module.exports = {
    readCoins,
    writeCoins
};