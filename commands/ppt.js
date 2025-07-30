// commands/ppt.js

const { readCoins, writeCoins } = require('../utils/coin_manager');
const { readBrincadeirasConfig } = require('../commands/brincadeiras');
const { PREFIX } = require('../config');
const fs = require('fs').promises;
const path = require('path');

const COINS_REWARD = 5;
const COOLDOWN_SECONDS = 10;
const COOLDOWN_PATH = path.resolve(__dirname, '../json/ppt_cooldown.json');

async function readCooldownData() {
    try {
        const data = await fs.readFile(COOLDOWN_PATH, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch (e) { return {}; }
}

async function writeCooldownData(data) {
    await fs.writeFile(COOLDOWN_PATH, JSON.stringify(data, null, 2));
}

const command = async (sock, m, jid, args, senderId, isGroup) => {
    try {
        if (isGroup) {
            const brincadeirasConfig = await readBrincadeirasConfig();
            if (brincadeirasConfig[jid]?.enabled !== true) {
                return sock.sendMessage(jid, { text: '❌ O modo *Brincadeiras* não está ativado neste grupo.' }, { quoted: m });
            }
        }
        
        const cooldowns = await readCooldownData();
        const now = Date.now();
        const userCooldown = cooldowns[senderId];

        if (userCooldown && (now - userCooldown < COOLDOWN_SECONDS * 1000)) {
            const timeLeft = Math.ceil((userCooldown + (COOLDOWN_SECONDS * 1000) - now) / 1000);
            return sock.sendMessage(jid, { text: `⏳ Você precisa esperar ${timeLeft} segundo(s) para jogar novamente.` }, { quoted: m });
        }
        
        const choices = ['pedra', 'papel', 'tesoura'];
        const choiceEmojis = { 'pedra': '✊', 'papel': '✋', 'tesoura': '✌️' };
        const userChoice = args[0]?.toLowerCase();

        if (!userChoice || !choices.includes(userChoice)) {
            const helpMessage = `❓ Jogada inválida! Use:\n\n- \`${PREFIX}ppt pedra\`\n- \`${PREFIX}ppt papel\`\n- \`${PREFIX}ppt tesoura\``;
            return sock.sendMessage(jid, { text: helpMessage }, { quoted: m });
        }

        // --- NOVO: Reage à mensagem do usuário para dar feedback ---
        await sock.sendMessage(jid, { react: { text: '🎲', key: m.key } });

        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        let resultMessage = `Você: ${choiceEmojis[userChoice]}\nEu:  ${choiceEmojis[botChoice]}\n\n`;
        let userWon = false;

        if (userChoice === botChoice) {
            resultMessage += "⚖️ *Deu empate!*";
        } else if (
            (userChoice === 'pedra' && botChoice === 'tesoura') ||
            (userChoice === 'papel' && botChoice === 'pedra') ||
            (userChoice === 'tesoura' && botChoice === 'papel')
        ) {
            resultMessage += `🎉 *Você venceu!* 🎉\n\nGanhou ${COINS_REWARD} moedas! 🪙`;
            userWon = true;
        } else {
            resultMessage += "😢 *Eu venci!*";
        }

        cooldowns[senderId] = Date.now();
        await writeCooldownData(cooldowns);

        if (userWon) {
            const coins = await readCoins();
            coins[senderId] = (coins[senderId] || 0) + COINS_REWARD;
            await writeCoins(coins);
        }
        
        // Pequeno delay para a resposta não chegar junto com a reação
        await new Promise(resolve => setTimeout(resolve, 500)); 
        await sock.sendMessage(jid, { text: resultMessage }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando ppt:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao tentar jogar.' }, { quoted: m });
    }
};

module.exports = command;