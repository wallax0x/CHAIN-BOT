const { PREFIX } = require('../config.js');
const path = require('path');
const fs = require('fs');

const activeGames = new Map();

const readBrincadeirasConfig = () => {
    const configPath = path.join(__dirname, '..', 'json', 'brincadeiras_config.json');
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};

const command = async (sock, m, jid, args) => {
    const brincadeirasConfig = readBrincadeirasConfig();
    if (!brincadeirasConfig[jid]?.enabled) {
        return sock.sendMessage(jid, { text: '❌ As brincadeiras estão desativadas neste grupo.' }, { quoted: m });
    }

    if (activeGames.has(jid)) {
        const currentGame = activeGames.get(jid);
        return sock.sendMessage(jid, { text: `⏳ Calma! Já tem um jogo em andamento. Estamos esperando @${currentGame.challenged.split('@')[0]} responder.`, mentions: [currentGame.challenged] }, { quoted: m });
    }
    
    const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) {
        return sock.sendMessage(jid, { text: `❓ Você precisa desafiar alguém! Use o formato: *${PREFIX}vdd @usuario*` }, { quoted: m });
    }

    const challenger = m.key.participant || m.key.remoteJid;
    if (target === challenger) {
        return sock.sendMessage(jid, { text: '😂 Você não pode desafiar a si mesmo!' }, { quoted: m });
    }

    activeGames.set(jid, {
        challenger: challenger,
        challenged: target,
    });

    console.log(`[Vdd] Jogo iniciado no grupo ${jid} por ${challenger} contra ${target}`);

    const message = `
╭─── • 🔥 *JOGO INICIADO* 🔥 • ───╮
│
│ 🤺 @${challenger.split('@')[0]}
│          *vs*
│ 🎯 @${target.split('@')[0]}
│
│ 😈 @${target.split('@')[0]}, a escolha é sua!
│ Você tem 1 minuto para responder com:
│
│ • *verdade*
│ • *desafio*
│ • *surpresa* (eu escolho por você!)
│
╰────────────────╯
    `.trim();

    await sock.sendMessage(jid, { text: message, mentions: [challenger, target] });

    setTimeout(() => {
        if (activeGames.has(jid) && activeGames.get(jid).challenged === target) {
            sock.sendMessage(jid, { text: `⏰ O tempo para @${target.split('@')[0]} responder acabou! Jogo cancelado.`, mentions: [target] });
            activeGames.delete(jid);
        }
    }, 60000);
};

module.exports = {
    command,
    activeGames
};