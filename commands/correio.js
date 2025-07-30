// commands/correio.js

const fs = require('fs').promises;
const path = require('path');

const COOLDOWN_PATH = path.resolve(__dirname, '../json/correio_cooldown.json');
const COOLDOWN_MINUTES = 5;

async function readCooldowns() {
    try {
        const data = await fs.readFile(COOLDOWN_PATH, 'utf8');
        return JSON.parse(data);
    } catch (e) { return {}; }
}

async function writeCooldowns(cooldowns) {
    await fs.writeFile(COOLDOWN_PATH, JSON.stringify(cooldowns, null, 2));
}

const command = async (sock, m, jid, args, PREFIX) => {
    try {
        const senderId = m.key.participant || m.key.remoteJid;
        
        // Verificação de Cooldown
        const cooldowns = await readCooldowns();
        const lastSentTimestamp = cooldowns[senderId];
        if (lastSentTimestamp) {
            const minutesSinceLastSent = (Date.now() - lastSentTimestamp) / (1000 * 60);
            if (minutesSinceLastSent < COOLDOWN_MINUTES) {
                const timeLeft = COOLDOWN_MINUTES - minutesSinceLastSent;
                return sock.sendMessage(jid, { text: `⏳ Você precisa esperar mais ${Math.ceil(timeLeft)} minuto(s) para enviar outro correio.` }, { quoted: m });
            }
        }

        // Parse e Validação dos Argumentos
        const rawContent = args.join(' ');
        const parts = rawContent.split('/');
        
        if (parts.length < 2 || !parts[0] || !parts[1]) {
            return sock.sendMessage(jid, { text: `❓ Formato incorreto!\n\nUse: \`${PREFIX}correio <número> / <sua mensagem>\`` }, { quoted: m });
        }
        
        const numberPart = parts[0].trim();
        const messagePart = parts.slice(1).join('/').trim();
        const recipientJid = `${numberPart.replace(/\D/g, '')}@s.whatsapp.net`;
        
        // Verificação se o Número Existe
        const [result] = await sock.onWhatsApp(recipientJid);
        if (!result || !result.exists) {
            return sock.sendMessage(jid, { text: `❌ O número fornecido não foi encontrado no WhatsApp.` }, { quoted: m });
        }
        
        // --- CORREÇÃO: Texto da mensagem alterado para ser neutro ---
        const correioMessage = `
📨 *Você Recebeu uma Mensagem Anônima!*

Alguém utilizou o bot para te enviar a seguinte mensagem:

\`\`\`
${messagePart}
\`\`\`

~ Enviado anonimamente através do bot.
        `.trim();

        // Envio e Feedback
        await sock.sendMessage(recipientJid, { text: correioMessage });

        cooldowns[senderId] = Date.now();
        await writeCooldowns(cooldowns);
        
        await sock.sendMessage(jid, { text: '✅ Seu correio anônimo foi enviado com sucesso!' }, { quoted: m });

    } catch (error) {
        console.error("Erro no comando correio:", error);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao enviar o correio. A pessoa pode ter bloqueado o bot.' }, { quoted: m });
    }
};

module.exports = command;