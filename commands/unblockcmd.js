// commands/unblockcmd.js
const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const BLOCKED_CMDS_PATH = path.resolve(__dirname, '../json/blocked_cmds.json');
const readBlockedCmds = async () => { try { const d=await fs.readFile(BLOCKED_CMDS_PATH,'utf8');return d?JSON.parse(d):{};}catch{return{};}};
const writeBlockedCmds = async (data) => { await fs.writeFile(BLOCKED_CMDS_PATH, JSON.stringify(data, null, 2)); };

module.exports = async (sock, m, jid, args) => {
    const cmdToUnblock = args[0]?.toLowerCase();
    if (!cmdToUnblock) {
        return sock.sendMessage(jid, { text: `❓ Qual comando você quer desbloquear?\n\n*Exemplo:* \`${PREFIX}unblockcmd ping\`` }, { quoted: m });
    }

    const blockedCmds = await readBlockedCmds();
    let groupBlocked = blockedCmds[jid] || [];

    if (!groupBlocked.includes(cmdToUnblock)) {
        return sock.sendMessage(jid, { text: `⚠️ O comando \`${cmdToUnblock}\` não estava bloqueado.` }, { quoted: m });
    }

    blockedCmds[jid] = groupBlocked.filter(cmd => cmd !== cmdToUnblock);
    await writeBlockedCmds(blockedCmds);

    await sock.sendMessage(jid, { text: `✅ O comando \`${cmdToUnblock}\` foi desbloqueado para todos no grupo.` }, { quoted: m });
};