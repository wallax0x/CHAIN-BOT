// commands/medidor.js

const fs = require('fs').promises;
const path = require('path');
const { readBrincadeirasConfig } = require('./brincadeiras');
const { PREFIX } = require('../config');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Central de Configuração dos Medidores ---
const medidorConfig = {
    'gay': {
        titulo: '🏳️‍🌈 DETECTOR DE GAY 🏳️‍🌈',
        imagem: 'gay.png',
        loadingText: 'Consultando os arquivos do vale...',
        frase: (percent) => {
            if (percent > 95) return `A MÁQUINA EXPLODIU DE TANTA VIADAGEM! 💥 O medidor quebrou e marcou *${percent}% Gay!*`;
            if (percent < 10) return `Análise concluída. Nível de masculinidade intacto. Você é apenas *${percent}% Gay!*`;
            return `Analisando suas partículas de arco-íris... detectamos que você é *${percent}% Gay!*`;
        }
    },
    'corno': {
        titulo: '🐂 CORNÔMETRO 🐂',
        imagem: 'corno.png',
        loadingText: 'Verificando o histórico de chifres...',
        frase: (percent) => `O peso na sua cabeça indica uma porcentagem de corno de *${percent}%*!`
    },
    'gado': {
        titulo: '🐄 MEDIDOR DE GADO 🐄',
        imagem: 'gado.png',
        loadingText: 'Analisando seu histórico de "oi, sumida"...',
        frase: (percent) => `Você é *${percent}% Gado(a)!* Moooo!`
    },
    'gostosa': {
        titulo: '🥵 GOSTOSÔMETRO 🥵',
        imagem: 'gostosa.png',
        loadingText: 'Calculando o nível de gostosura...',
        frase: (percent) => `A máquina superaqueceu! Seu nível de gostosura é de *${percent}%*! 🔥`
    },

    // --- NOVOS MEDIDORES ADICIONADOS ---
    'psicopata': {
        titulo: '🔪 MEDIDOR DE PSICOPATIA 🔪',
        imagem: 'psicopata.png', // Adicione esta imagem na pasta /assets
        loadingText: 'Verificando seus parafusos a menos...',
        frase: (percent) => `Seu nível de psicopatia é de *${percent}%*. É melhor o pessoal tomar cuidado...`
    },
    'sapo': {
        titulo: '🐸 SAPÔMETRO 🐸',
        imagem: 'sapo.png', // Adicione esta imagem na pasta /assets
        loadingText: 'Analisando seu nível de zica...',
        frase: (percent) => `Detectamos que você tem *${percent}%* de chance de zicar o rolê!`
    },
    'preguica': {
        titulo: '😴 PREGUIÇÔMETRO 😴',
        imagem: 'preguica.png', // Adicione esta imagem na pasta /assets
        loadingText: 'Medindo sua vontade de não fazer nada...',
        frase: (percent) => `Sua bateria social está em *${100 - percent}%*. Nível de preguiça detectado: *${percent}%*!`
    },
};
// --- FIM DA ADIÇÃO ---

const command = async (sock, m, jid, args, senderId, comando, isGroup) => {
    // O resto do código continua exatamente o mesmo...
    try {
        if (isGroup) {
            const brincadeirasConfig = await readBrincadeirasConfig();
            if (brincadeirasConfig[jid]?.enabled !== true) {
                return sock.sendMessage(jid, { text: `❌ As brincadeiras estão desativadas neste grupo. Peça para um admin ativar com \`${PREFIX}brincadeiras on\`.` }, { quoted: m });
            }
        }
        const config = medidorConfig[comando];
        if (!config) return;
        const targetId = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || senderId;
        await sock.sendMessage(jid, { react: { text: '🔬', key: m.key } });
        await sock.sendMessage(jid, { text: `🔬 ${config.loadingText}` }, { quoted: m });
        await delay(3000);
        let porcentagem = (comando === 'gay') ? Math.floor(Math.random() * 121) : Math.floor(Math.random() * 101);
        const progress = Math.min(10, Math.floor(porcentagem / 10));
        const progressBar = "█".repeat(progress) + "░".repeat(10 - progress);
        const mensagemFinal = `
${config.titulo}

Analisando: @${targetId.split('@')[0]}
*Resultado:*

┌─〔 *Medição Final* 〕
│
│ *Nível:* ${porcentagem}%
│ \`[${progressBar}]\`
│
└─ ▸ _${config.frase(porcentagem)}_
        `.trim();
        const imagePath = path.resolve(__dirname, '..', 'assets', config.imagem);
        await sock.sendMessage(jid, { image: { url: imagePath }, caption: mensagemFinal, mentions: [targetId] }, { quoted: m });
    } catch (e) {
        console.error(`Erro no comando ${comando}:`, e);
        await sock.sendMessage(jid, { text: `❌ Ops! A imagem para o medidor *${comando}* não foi encontrada na pasta 'assets'.` }, { quoted: m });
    }
};

module.exports = command;