// commands/dispositivos.js (Versão Censo 2.0)
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
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }
        
        await sock.sendMessage(jid, { react: { text: '📊', key: m.key } });

        const metadata = await sock.groupMetadata(jid);
        const members = metadata.participants;
        const deviceLog = readDeviceLog();

        let responseText = `*📊 Censo de Dispositivos de ${metadata.subject} 📊*\n\n_Analisando ${members.length} membros..._\n\n`;
        let deviceCounts = {
            iphone: 0,
            android: 0,
            web: 0,
            desktop: 0,
            desconhecido: 0,
            outros: 0
        };

        for (const member of members) {
            const memberId = member.id;
            const memberName = member.notify || memberId.split('@')[0];
            
            // Pega o dispositivo do nosso "banco de dados"
            const device = deviceLog[memberId] || 'Desconhecido';

            let deviceEmoji = '❓';
            let deviceName = 'Desconhecido';

            if (device === 'android') { deviceName = 'Android'; deviceEmoji = '🤖'; deviceCounts.android++; }
            else if (device === 'ios') { deviceName = 'iPhone'; deviceEmoji = '🍎'; deviceCounts.iphone++; }
            else if (device === 'web') { deviceName = 'WhatsApp Web'; deviceEmoji = '💻'; deviceCounts.web++; }
            else if (device === 'desktop') { deviceName = 'App Desktop'; deviceEmoji = '🖥️'; deviceCounts.desktop++; }
            else if (device !== 'Desconhecido') { deviceName = device.charAt(0).toUpperCase() + device.slice(1); deviceEmoji = '📱'; deviceCounts.outros++; }
            else { deviceCounts.desconhecido++; }

            responseText += `${deviceEmoji} *${memberName}:* ${deviceName}\n`;
        }

        responseText += `\n\n*Resumo do Censo:*\n`;
        responseText += `🍎 iPhones: *${deviceCounts.iphone}*\n`;
        responseText += `🤖 Androids: *${deviceCounts.android}*\n`;
        responseText += `💻 Web: *${deviceCounts.web}*\n`;
        responseText += `🖥️ Desktop: *${deviceCounts.desktop}*\n`;
        responseText += `📱 Outros: *${deviceCounts.outros}*\n`;
        responseText += `❓ Desconhecidos: *${deviceCounts.desconhecido}*\n`;
        
        await sock.sendMessage(jid, { text: responseText.trim() }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando dispositivos:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao gerar o censo de dispositivos.' }, { quoted: m });
    }
};

module.exports = command;