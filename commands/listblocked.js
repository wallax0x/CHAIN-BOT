// commands/listblocked.js
const fs = require('fs').promises;
const path = require('path');

const BLOCKED_CMDS_PATH = path.resolve(__dirname, '../json/blocked_cmds.json');
const readBlockedCmds = async () => { try { const d=await fs.readFile(BLOCKED_CMDS_PATH,'utf8');return d?JSON.parse(d):{};}catch{return{};}};

module.exports = async (sock, m, jid) => {
    const blockedCmds = await readBlockedCmds();
    const groupBlocked = blockedCmds[jid] || [];

    if (groupBlocked.length === 0) {
        return sock.sendMessage(jid, { text: '✅ Nenhum comando está bloqueado neste grupo.' }, { quoted: m });
    }

    let message = '*🚫 Comandos Bloqueados para Membros Comuns:*\n\n';
    groupBlocked.forEach((cmd, index) => {
        message += `${index + 1}. \`${cmd}\`\n`;
    });

    await sock.sendMessage(jid, { text: message.trim() }, { quoted: m });
};