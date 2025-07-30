// commands/daily.js

const fs = require('fs').promises;
const path = require('path');
const { addXp } = require('../utils/xp_manager');
const { readCoins, writeCoins } = require('../utils/coin_manager');
// IMPORTANTE: Importa a função para verificar se o usuário quer ganhar XP
const { readXpOptinConfig } = require('./gerenciarxp');

const CLAIMS_PATH = path.resolve(__dirname, '../json/daily_claims.json');

// --- Defina aqui as recompensas ---
const XP_REWARD = 100;
const COINS_REWARD = 20;
const COOLDOWN_HOURS = 24;

async function readClaims() {
    try {
        const data = await fs.readFile(CLAIMS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(CLAIMS_PATH, JSON.stringify({}));
            return {};
        }
        return {};
    }
}

async function writeClaims(claims) {
    await fs.writeFile(CLAIMS_PATH, JSON.stringify(claims, null, 2), 'utf8');
}

const command = async (sock, m, jid) => {
    try {
        const senderId = m.key.participant || m.key.remoteJid;
        const now = new Date();
        
        const claims = await readClaims();
        const lastClaimTimestamp = claims[senderId];

        if (lastClaimTimestamp) {
            const lastClaimDate = new Date(lastClaimTimestamp);
            const hoursSinceLastClaim = (now - lastClaimDate) / (1000 * 60 * 60);

            if (hoursSinceLastClaim < COOLDOWN_HOURS) {
                const hoursRemaining = COOLDOWN_HOURS - hoursSinceLastClaim;
                const h = Math.floor(hoursRemaining);
                const m = Math.floor((hoursRemaining - h) * 60);
                const waitMessage = `⏳ Você já resgatou sua recompensa diária. Por favor, aguarde mais *${h} hora(s) e ${m} minuto(s)*.`;
                
                // --- CORREÇÃO 1: Envia a mensagem de espera sem o 'quoted' para evitar o crash ---
                return sock.sendMessage(jid, { text: waitMessage });
            }
        }

        // --- CORREÇÃO 2: Verifica se o usuário optou por receber XP ---
        const xpOptinConfig = await readXpOptinConfig();
        const userWantsXp = xpOptinConfig[senderId] === true;
        let xpGainedMessage = '';

        if (userWantsXp) {
            await addXp(senderId, XP_REWARD);
            xpGainedMessage = `✨ *${XP_REWARD}* de XP\n`;
        } else {
            xpGainedMessage = '✨ *0* de XP (Você optou por não participar do ranking)\n';
        }

        // Adicionar as Moedas (todos ganham moedas, independente do XP)
        const coins = await readCoins();
        coins[senderId] = (coins[senderId] || 0) + COINS_REWARD;
        await writeCoins(coins);

        // Atualizar o horário do resgate
        claims[senderId] = now.toISOString();
        await writeClaims(claims);

        // Enviar mensagem de sucesso personalizada
        const successMessage = `
🎉 *RECOMPENSA DIÁRIA RESGATADA!* 🎉

Você ganhou:
${xpGainedMessage}🪙 *${COINS_REWARD}* Moedas

Volte em 24 horas para resgatar novamente!
        `.trim();

        await sock.sendMessage(jid, { text: successMessage }, { quoted: m });

    } catch (error) {
        console.error("Erro no comando daily:", error);
        await sock.sendMessage(jid, { text: "❌ Ocorreu um erro ao resgatar sua recompensa." }, { quoted: m });
    }
};

module.exports = command;