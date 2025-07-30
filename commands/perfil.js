// commands/perfil.js (VERSÃO FINAL DEFINITIVA)

const { getUserXp, getXpNeededForLevel } = require('../utils/xp_manager');
const { readCoins } = require('../utils/coin_manager');
const { findUserRelationship } = require('./relacionamento.js'); // Verifique se o caminho está correto
const fs = require('fs').promises;
const path = require('path');
const CONSELHOS = require('../utils/conselhos.json');

const DEVICE_LOG_PATH = path.join(__dirname, '..', 'data', 'device_log.json');
const RELACIONAMENTOS_PATH = path.join(__dirname, '..', 'json', 'relacionamentos.json');

// Funções auxiliares de leitura de dados
const readDeviceLog = async () => { try{const d=await fs.readFile(DEVICE_LOG_PATH,'utf8');return JSON.parse(d);}catch(e){return{};}};
const readRelationships = async () => { try{const d=await fs.readFile(RELACIONAMENTOS_PATH,'utf8');return JSON.parse(d);}catch(e){return{casais:{}};}};

// A função do comando agora recebe 'startTime'
const command = async (sock, m, jid, args, senderId, command, startTime) => {
    try {
        const mentionedJid = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const targetId = mentionedJid || m.key.participant || m.key.remoteJid;

        // Busca todos os dados necessários de uma só vez
        const [userData, coinsData, relationshipsData, deviceLog, metadata] = await Promise.all([
            getUserXp(targetId),
            readCoins(),
            readRelationships(),
            readDeviceLog(),
            sock.groupMetadata(jid).catch(() => null)
        ]);
        
        const participant = metadata?.participants.find(p => p.id === targetId);
        const targetName = participant?.notify || m.pushName || "Usuário";
        
        // --- DADOS DO PERFIL ---
        const userCoins = coinsData[targetId] || 0;
        const userTitle = userData.title || 'Novato';
        const cargo = participant?.admin === 'superadmin' ? '👑 Dono(a)' : (participant?.admin === 'admin' ? '🛡️ Admin' : '👤 Membro');
        
        // --- LÓGICA DA BARRA DE PROGRESSO DE XP ---
        const xpForCurrentLevel = getXpNeededForLevel(userData.level);
        const xpForNextLevel = getXpNeededForLevel(userData.level + 1);
        const xpInThisLevel = userData.xp - xpForCurrentLevel;
        const totalXpForThisLevel = xpForNextLevel - xpForCurrentLevel;
        const percentage = totalXpForThisLevel > 0 ? (xpInThisLevel / totalXpForThisLevel) * 100 : 100;
        const progressBarLength = 12;
        const filledChars = Math.round((percentage / 100) * progressBarLength);
        const emptyChars = progressBarLength - filledChars;
        const progressBar = '█'.repeat(filledChars) + '░'.repeat(emptyChars);

        // --- LÓGICA DE RELACIONAMENTO ---
        const rel = findUserRelationship(targetId, relationshipsData);
        let relStatus = 'Solteiro(a)';
        let mentions = [targetId];
        if (rel) {
            const partnerId = rel.idPrincipal === targetId ? rel.partner : rel.idPrincipal;
            relStatus = rel.status === 'casado' ? `💍 Casado(a) com @${partnerId.split('@')[0]}` : `💖 Namorando com @${partnerId.split('@')[0]}`;
            mentions.push(partnerId);
        }

        // --- LÓGICA DOS ATRIBUTOS FIXOS POR SESSÃO ---
        const userSeed = parseInt(targetId.replace(/\D/g, '').slice(-6));
        const sessionSeed = startTime ? parseInt(String(startTime).slice(-6)) : Date.now(); // Usa o tempo atual como fallback
        const finalSeed = userSeed + sessionSeed;

        const carisma = (finalSeed % 90) + 10;
        const inteligencia = (finalSeed % 80) + 20;
        const sorte = (finalSeed % 100) + 1;
        const estilo = (finalSeed % 71) + 30;
        const valorPasse = ((finalSeed % 451) + 50).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // --- LÓGICA DO CONSELHO ALEATÓRIO ---
        const conselhoDoDia = CONSELHOS[Math.floor(Math.random() * CONSELHOS.length)];

        // --- LAYOUT FINAL COMPLETO ---
        const profileMessage = `╭───「 *👤 PERFIL DE @${targetId.split('@')[0]}* 」\n` +
                             `│\n` +
                             `├─ *Título:* ${userTitle}\n` +
                             `├─ *Status:* ${relStatus}\n` +
                             `├─ *Cargo:* ${cargo}\n` +
                             `│\n` +
                             `├───「 *🎮 Status de Jogo* 」\n` +
                             `│\n` +
                             `├─ *Nível:* ${userData.level} 👑\n` +
                             `├─ *Moedas:* ${userCoins} 💰\n` +
                             `├─ *XP:* ${xpInThisLevel} / ${totalXpForThisLevel}\n` +
                             `├─ *Progresso:* \`[${progressBar}]\` *${percentage.toFixed(1)}%*\n` +
                             `│\n` +
                             `├───「 *✨ Atributos da Sessão* 」\n` +
                             `│\n` +
                             `├─ *Carisma:* ${carisma} / 100 😎\n` +
                             `├─ *Inteligência:* ${inteligencia} / 100 🧠\n` +
                             `├─ *Sorte:* ${sorte} / 100 🍀\n` +
                             `├─ *Estilo:* ${estilo} / 100 🔥\n` +
                             `├─ *Valor do Passe:* ${valorPasse} 🎟️\n` +
                             `│\n` +
                             `╰───「 *💡 Conselho do Dia* 」\n` +
                             `     _"${conselhoDoDia}"_`;

        const profilePicUrl = await sock.profilePictureUrl(targetId, 'image').catch(() => './assets/default_pfp.png');
        await sock.sendMessage(jid, { image: { url: profilePicUrl }, caption: profileMessage, mentions });

    } catch (error) {
        console.error("Erro fatal no comando perfil:", error);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao gerar o perfil.' }, { quoted: m });
    }
};

module.exports = command;