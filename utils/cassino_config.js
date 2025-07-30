// utils/cassino_config.js (VERSÃO REBALANCEADA)

const ROLETTE_SLOTS = [
    // --- Prêmios Comuns ---
    { emoji: '🍒', payout: 1.5, peso: 20, raridade: 'Comum' },      // Ganhos menores, mais comuns
    { emoji: '🍊', payout: 1.5, peso: 20, raridade: 'Comum' },
    { emoji: '🍇', payout: 2,   peso: 15, raridade: 'Incomum' },
    { emoji: '🍉', payout: 2,   peso: 15, raridade: 'Incomum' },
    
    // --- Prêmios Raros e Lendários (Mais difíceis de conseguir) ---
    { emoji: '🍀', payout: 3,   peso: 8,  raridade: 'Raro' },
    { emoji: '💎', payout: 5,   peso: 4,  raridade: 'Épico' },
    { emoji: '7️⃣', payout: 10,  peso: 1,  raridade: 'LENDÁRIO' }, // NOVO: Prêmio máximo!

    // --- Perdas (Maior chance de ocorrer) ---
    { emoji: '💀', payout: 0,   peso: 50, raridade: 'Perdeu' },
    { emoji: '🤡', payout: 0,   peso: 40, raridade: 'Perdeu' }
];

// Emojis para a animação da roleta (adicionamos o 7️⃣)
const ANIMATION_EMOJIS = ['🍒', '🍊', '🍇', '🍉', '🍀', '💎', '💀', '🤡', '💰', '🎰', '7️⃣'];

module.exports = { ROLETTE_SLOTS, ANIMATION_EMOJIS };