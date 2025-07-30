// commands/ping.js
const os = require('os');
const { getUptime } = require('../utils/uptime');

module.exports = async (sock, m, jid) => {
    try {
        // Reação imediata para feedback
        await sock.sendMessage(jid, { react: { text: '📡', key: m.key } });

        const latency = Date.now() - (m.messageTimestamp * 1000);
        const uptimeString = getUptime();
        
        // Coleta de informações do sistema (sem alterações)
        const botName = sock.user?.name || 'Bot';
        const nodeVersion = process.version;
        const hostname = os.hostname();
        const cpuModel = os.cpus()[0].model.trim() || 'N/A';
        const totalMemGB = (os.totalmem() / (1024 ** 3));
        const freeMemGB = (os.freemem() / (1024 ** 3));
        const usedMemGB = (totalMemGB - freeMemGB);

        // --- NOVO: Cálculo da Barra de Progresso da RAM ---
        const memUsagePercent = (usedMemGB / totalMemGB) * 100;
        const progress = Math.floor(memUsagePercent / 10);
        const ramBar = "█".repeat(progress) + "░".repeat(10 - progress);

        // --- NOVO: Mensagem final com layout de "Card" ---
        const responseMessage =
`╭───⌈ 🩺 *STATUS DO SISTEMA* 🩺 ⌋
│
├─ ⚡ *Desempenho*
│  ├─ Latência: ${latency} ms
│  ╰─ Tempo Ativo: ${uptimeString}
│
├─ 🧠 *Memória RAM*
│  ├─ \`${ramBar}\` (${memUsagePercent.toFixed(2)}%)
│  ╰─ Uso: ${usedMemGB.toFixed(2)} GB / ${totalMemGB.toFixed(2)} GB
│
├─ 💻 *Hardware & Software*
│  ├─ Host: ${hostname}
│  ├─ CPU: ${cpuModel}
│  ╰─ Node.js: ${nodeVersion}
│
╰───────────────`.trim();

        await sock.sendMessage(jid, { text: responseMessage }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando ping:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao obter as informações.' }, { quoted: m });
    }
};