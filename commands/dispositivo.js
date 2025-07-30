// commands/dispositivos.js (Versão Final com Resposta, Menção e Padrão)

const { getDevice } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');

const DEVICE_LOG_PATH = path.join(__dirname, '..', 'data', 'device_log.json');

// Função para ler o log de dispositivos
const readDeviceLog = () => {
    try {
        if (fs.existsSync(DEVICE_LOG_PATH)) {
            const data = fs.readFileSync(DEVICE_LOG_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Erro ao ler device_log.json:", e);
    }
    return {};
};


const command = async (sock, m, jid, args) => {
    try {
        let targetJid;
        let device;
        
        const contextInfo = m.message?.extendedTextMessage?.contextInfo;
        const mentionedJid = contextInfo?.mentionedJid?.[0];

        // --- NOVA LÓGICA DE PRIORIDADE ---

        // 1. PRIORIDADE: MENSAGEM RESPONDIDA
        if (contextInfo?.quotedMessage) {
            console.log("[Dispositivos] Modo: Resposta");
            targetJid = contextInfo.participant;
            device = getDevice(contextInfo.stanzaId);
        } 
        // 2. PRIORIDADE: MENÇÃO
        else if (mentionedJid) {
            console.log("[Dispositivos] Modo: Menção");
            targetJid = mentionedJid;
            const deviceLog = readDeviceLog();
            device = deviceLog[targetJid]; // Pega o dispositivo da "memória"
        }
        // 3. PADRÃO: AUTOR DO COMANDO
        else {
            console.log("[Dispositivos] Modo: Padrão (autor do comando)");
            targetJid = m.key.participant || m.key.remoteJid;
            device = getDevice(m.key.id);
        }
        
        // --- FORMATAÇÃO DA RESPOSTA (MESMA LÓGICA DE ANTES) ---
        let deviceName = 'Desconhecido';
        let deviceEmoji = '❓';

        if (device === 'android') { deviceName = 'Android'; deviceEmoji = '🤖'; }
        else if (device === 'ios') { deviceName = 'iPhone'; deviceEmoji = '🍎'; }
        else if (device === 'web') { deviceName = 'WhatsApp Web'; deviceEmoji = '💻'; }
        else if (device === 'desktop') { deviceName = 'App Desktop'; deviceEmoji = '🖥️'; }
        else if (device) { deviceName = device.charAt(0).toUpperCase() + device.slice(1); deviceEmoji = '📱'; }

        if (deviceName === 'Desconhecido') {
             return sock.sendMessage(jid, { text: `❌ Não consegui identificar o dispositivo de @${targetJid.split('@')[0]}. O bot ainda não 'viu' uma mensagem desta pessoa.`, mentions: [targetJid] }, { quoted: m });
        }

        const responseText = `${deviceEmoji} O último dispositivo detectado de @${targetJid.split('@')[0]} foi *${deviceName}*.`;

        await sock.sendMessage(jid, { text: responseText, mentions: [targetJid] }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando dispositivos:", e);
        await sock.sendMessage(jid, { 
            text: `❌ Ocorreu um erro ao processar o comando.` 
        }, { quoted: m });
    }
};

module.exports = command;