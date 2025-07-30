// const fs = require('fs').promises; // Removido, pois o coin_manager agora lida com isso
const path = require('path');
const { PREFIX } = require('../config');
const hangmanWords = require('../utils/hangman_words');
// AGORA: Importa as funções de moedas do novo coins_manager.js
const { readCoins, writeCoins } = require('../utils/coin_manager'); // Corrigido para o nome do arquivo que criamos

const hangmanGames = {};

// As funções locais readCoins e writeCoins foram removidas.

const hangmanDisplay = [
    `
  +---+
  |   |
      |
      |
      |
      |
=========
`,
    `
  +---+
  |   |
  O   |
      |
      |
      |
=========
`,
    `
  +---+
  |   |
  O   |
  |   |
      |
      |
=========
`,
    `
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========
`,
    `
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========
`,
    `
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========
`,
    `
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========
`
];

async function forcaMain(sock, m, jid, args, subCommand, prefixUsed) {
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const groupId = jid;
        const senderId = m.key.participant || m.participant || m.key.remoteJid;
        const senderMention = `@${senderId.split('@')[0]}`;

        let game = hangmanGames[groupId];

        if (subCommand === 'forca') {
            if (game) {
                return sock.sendMessage(jid, { text: `⚠️ Já existe um jogo da Forca em andamento neste grupo! A palavra atual tem ${game.word.length} letras. Erros: ${game.wrongGuesses}/${game.maxWrongGuesses}\n\n${game.display}\n\nPara tentar: *${PREFIX}letra [sua_letra]* ou *${PREFIX}palavra [sua_palavra]*`, quoted: m });
            }

            let category = args[0] ? args[0].toLowerCase() : 'geral';
            let words = hangmanWords[category];

            if (!words || words.length === 0) {
                const availableCategories = Object.keys(hangmanWords).map(cat => `\`${cat}\``).join(', ');
                return sock.sendMessage(jid, { text: `❌ Categoria "${args[0]}" não encontrada ou vazia. Categorias disponíveis: ${availableCategories}.\nExemplo: *${PREFIX}forca frutas*`, quoted: m });
            }

            const word = words[Math.floor(Math.random() * words.length)].toUpperCase();
            const guessedLetters = Array(word.length).fill('_');

            hangmanGames[groupId] = {
                word: word,
                guessedLetters: guessedLetters,
                wrongGuesses: 0,
                maxWrongGuesses: hangmanDisplay.length - 1,
                players: {},
                category: category,
                display: hangmanDisplay[0] + guessedLetters.join(' '),
                creator: senderId
            };
            game = hangmanGames[groupId];

            await sock.sendMessage(jid, { text: `🎯 Jogo da Forca iniciado! A palavra tem ${word.length} letras na categoria *${category.toUpperCase()}*. Você tem ${game.maxWrongGuesses} chances.\n\n${game.display}\n\nPara tentar: *${PREFIX}letra [sua_letra]* ou *${PREFIX}palavra [sua_palavra]*`, quoted: m });
            return;
        }

        if (!game) {
            return sock.sendMessage(jid, { text: `⚠️ Não há jogo da Forca em andamento neste grupo. Use *${PREFIX}forca [categoria]* para iniciar um.`, quoted: m });
        }

        const guess = args[0] ? args[0].toUpperCase() : '';

        if (subCommand === 'letra') {
            if (!guess || guess.length !== 1 || !guess.match(/^[A-Z]$/)) {
                return sock.sendMessage(jid, { text: `❌ *Uso inválido.* Para palpitar uma letra, use: *${PREFIX}letra [sua_letra]* (Ex: *${PREFIX}letra a*)`, quoted: m });
            }
            if (game.guessedLetters.includes(guess)) {
                return sock.sendMessage(jid, { text: `⚠️ A letra "${guess}" já foi revelada na palavra.`, quoted: m });
            }

            if (game.word.includes(guess)) {
                for (let i = 0; i < game.word.length; i++) {
                    if (game.word[i] === guess) {
                        game.guessedLetters[i] = guess;
                    }
                }
                game.display = hangmanDisplay[game.wrongGuesses] + game.guessedLetters.join(' ');
                
                if (!game.guessedLetters.includes('_')) {
                    const coins = await readCoins();
                    coins[senderId] = (coins[senderId] || 0) + 10;
                    await writeCoins(coins);
                    await sock.sendMessage(jid, { text: `🎉 Parabéns, ${senderMention}! Você acertou a palavra! A palavra era *${game.word}*!\n\nGanhou 10 moedas! Sua conta agora tem ${coins[senderId]} moedas.`, mentions: [senderId] });
                    delete hangmanGames[groupId];
                } else {
                    await sock.sendMessage(jid, { text: `✅ Boa! A letra "${guess}" está na palavra!\n\n${game.display}`, quoted: m });
                }
            } else {
                game.wrongGuesses++;
                game.display = hangmanDisplay[game.wrongGuesses] + game.guessedLetters.join(' ');
                
                if (game.wrongGuesses >= game.maxWrongGuesses) {
                    await sock.sendMessage(jid, { text: `😔 Que pena, ${senderMention}! Você não conseguiu adivinhar a palavra. A palavra era *${game.word}*.\n\n${game.display}`, mentions: [senderId] });
                    delete hangmanGames[groupId];
                } else {
                    await sock.sendMessage(jid, { text: `❌ A letra "${guess}" não está na palavra. Erros: ${game.wrongGuesses}/${game.maxWrongGuesses}\n\n${game.display}`, quoted: m });
                }
            }
        } else if (subCommand === 'palavra') {
            if (!guess || guess.length <= 1 || !guess.match(/^[A-Z]+$/)) {
                return sock.sendMessage(jid, { text: `❌ *Uso inválido.* Para palpitar a palavra, use: *${PREFIX}palavra [sua_palavra]* (Ex: *${PREFIX}palavra COMPUTADOR*)`, quoted: m });
            }
            if (guess === game.word) {
                const coins = await readCoins();
                coins[senderId] = (coins[senderId] || 0) + 10;
                await writeCoins(coins);
                await sock.sendMessage(jid, { text: `🎉 Parabéns, ${senderMention}! Você acertou a palavra! A palavra era *${game.word}*!\n\nGanhou 10 moedas! Sua conta agora tem ${coins[senderId]} moedas.`, mentions: [senderId] });
                delete hangmanGames[groupId];
            } else {
                game.wrongGuesses++;
                game.display = hangmanDisplay[game.wrongGuesses] + game.guessedLetters.join(' ');
                
                if (game.wrongGuesses >= game.maxWrongGuesses) {
                    await sock.sendMessage(jid, { text: `😔 Que pena, ${senderMention}! Você não conseguiu adivinhar a palavra. A palavra era *${game.word}*.\n\n${game.display}`, mentions: [senderId] });
                    delete hangmanGames[groupId];
                } else {
                    await sock.sendMessage(jid, { text: `❌ Palavra incorreta! Erros: ${game.wrongGuesses}/${game.maxWrongGuesses}\n\n${game.display}`, quoted: m });
                }
            }
        }

    } catch (e) {
        console.error('Erro no comando forca:', e);
        if (hangmanGames[jid]) {
            delete hangmanGames[jid];
        }
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro inesperado no jogo da Forca. O jogo foi reiniciado.', quoted: m });
    }
}

// --- CORREÇÃO NA EXPORTAÇÃO ---
// A função principal é a exportação padrão.
module.exports = forcaMain;

// Funções ou propriedades adicionais são anexadas a ela.
module.exports.isGameActive = (groupId) => {
    return !!hangmanGames[groupId];
};