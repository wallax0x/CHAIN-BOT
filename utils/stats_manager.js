// utils/stats_manager.js

const fs = require('fs').promises;
const path = require('path');

const STATS_PATH = path.resolve(__dirname, '../json/group_stats.json');
let statsCache = {}; // O nosso "cofre" na memória

// 1. Carrega os dados para o cache UMA VEZ quando o bot inicia.
async function loadStats() {
    try {
        const data = await fs.readFile(STATS_PATH, 'utf8');
        statsCache = JSON.parse(data);
        console.log('[STATS_MANAGER] Estatísticas carregadas para a memória.');
    } catch (e) {
        console.warn("[STATS_MANAGER] Arquivo de stats não encontrado. Começando um novo.");
        statsCache = {};
    }
}

// 2. Salva o cache de volta para o arquivo periodicamente.
async function saveStats() {
    try {
        await fs.writeFile(STATS_PATH, JSON.stringify(statsCache, null, 2));
        console.log('[STATS_MANAGER] Estatísticas salvas no arquivo.');
    } catch (e) {
        console.error("[STATS_MANAGER] Erro ao salvar estatísticas:", e);
    }
}

// 3. A ÚNICA função que outros arquivos usarão para atualizar os dados.
function updateUserStat(jid, senderId, statType) {
    if (!jid || !senderId) return;

    if (!statsCache[jid]) statsCache[jid] = {};
    if (!statsCache[jid][senderId]) statsCache[jid][senderId] = { msg: 0, cmd: 0, figu: 0 };

    if (statsCache[jid][senderId][statType] !== undefined) {
        statsCache[jid][senderId][statType]++;
    }
}

// 4. Função para o comando .topativos ler os dados.
function getStats() {
    return statsCache;
}

// Carrega na inicialização e configura o salvamento automático
loadStats();
setInterval(saveStats, 60000); // Salva a cada 60 segundos

// Exporta apenas as funções que os outros arquivos precisam
module.exports = {
    updateUserStat,
    getStats
};