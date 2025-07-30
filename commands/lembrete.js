// commands/lembrete.js
const { PREFIX } = require('../config');

// Função auxiliar para converter o tempo (ex: "10m") para milissegundos
const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const unit = timeStr.slice(-1).toLowerCase();
    const value = parseInt(timeStr.slice(0, -1));

    if (isNaN(value)) return 0;

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 0;
    }
};

const command = async (sock, m, jid, args, senderId) => {
    try {
        const timeStr = args[0];
        const messageToRemind = args.slice(1).join(' ');

        // 1. Validação da Entrada com Mensagem Enfeitada
        if (!timeStr || !messageToRemind) {
            const helpMsg = `
╭───⌈ ⏰ *AGENDAR LEMBRETE* ⌋
│
│  Use o formato:
│  \`${PREFIX}lembrete <tempo> <mensagem>\`
│
├─ ⋅ *Unidades de Tempo* ⋅ ─
│  \`s\` ➜ segundos
│  \`m\` ➜ minutos
│  \`h\` ➜ horas
│  \`d\` ➜ dias
│
├─ ⋅ *Exemplo* ⋅ ─
│  \`${PREFIX}lembrete 30m Comprar pão\`
│
╰───────────────`;
            return sock.sendMessage(jid, { text: helpMsg.trim() }, { quoted: m });
        }

        const delayMs = parseTime(timeStr);

        // 2. Validação do Tempo
        if (delayMs <= 0) {
            return sock.sendMessage(jid, { text: '❌ Formato de tempo inválido. Use, por exemplo: 10s, 5m, 2h, 1d.' }, { quoted: m });
        }
        const maxDelay = 30 * 24 * 60 * 60 * 1000;
        if (delayMs > maxDelay) {
            return sock.sendMessage(jid, { text: '❌ O tempo máximo para um lembrete é de 30 dias.' }, { quoted: m });
        }

        // 3. Confirmação e Agendamento com Mensagem Enfeitada
        const confirmationMsg = `
╭───⌈ ✅ *LEMBRETE AGENDADO* ⌋
│
│  *Tarefa:* _${messageToRemind}_
│
│  *Quando:* Daqui a *${timeStr}*
│
╰───────────────`;
        await sock.sendMessage(jid, { text: confirmationMsg.trim() }, { quoted: m });

        // 4. Agenda o envio do lembrete
        setTimeout(async () => {
            try {
                const reminderMessage = `
╭───⌈ ⏰ *HORA DO LEMBRETE!* ⌋
│
│  Olá, @${senderId.split('@')[0]}!
│  Você me pediu para te lembrar de:
│
│  💬 *"${messageToRemind}"*
│
╰───────────────`;
                await sock.sendMessage(jid, {
                    text: reminderMessage.trim(),
                    mentions: [senderId]
                }, { quoted: m });
            } catch (e) {
                console.error("Erro ao enviar o lembrete agendado:", e);
            }
        }, delayMs);

    } catch (e) {
        console.error('Erro no comando lembrete:', e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao agendar seu lembrete.' }, { quoted: m });
    }
};

module.exports = command;