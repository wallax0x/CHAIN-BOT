// utils/caixa_premios.js

const ITENS_DA_CAIXA = [
    // --- Prêmios Comuns (Chance alta: 65%) ---
    { nome: '15 Moedas', tipo: 'moedas', valor: 15, raridade: 'comum', peso: 25 },
    { nome: '30 Moedas', tipo: 'moedas', valor: 30, raridade: 'comum', peso: 20 },
    { nome: '50 XP', tipo: 'xp', valor: 50, raridade: 'comum', peso: 20 },

    // --- Prêmios Incomuns (Chance média: 25%) ---
    { nome: '120 Moedas', tipo: 'moedas', valor: 120, raridade: 'incomum', peso: 15 },
    { nome: '200 XP', tipo: 'xp', valor: 200, raridade: 'incomum', peso: 10 },

    // --- Prêmios Raros (Chance baixa: 8%) ---
    { nome: '500 Moedas', tipo: 'moedas', valor: 500, raridade: 'raro', peso: 5 },
    { nome: 'um Título Personalizado!', tipo: 'item', valor: 'ticket_titulo', raridade: 'raro', peso: 3, desc: 'Use `.usar titulo <nome>` para definir um novo título!' },

    // --- Prêmio Lendário (Chance muito baixa: 2%) ---
    { nome: 'outra Caixa Misteriosa!', tipo: 'item', valor: 'caixa', raridade: 'lendario', peso: 2 }
];

module.exports = ITENS_DA_CAIXA;