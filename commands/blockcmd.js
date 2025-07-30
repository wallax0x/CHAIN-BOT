// commands/blockcmd.js
const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const BLOCKED_CMDS_PATH = path.resolve(__dirname, '../json/blocked_cmds.json');
const readBlockedCmds = async () => { try { const d=await fs.readFile(BLOCKED_CMDS_PATH,'utf8');return d?JSON.parse(d):{};}catch{return{};}};
const writeBlockedCmds = async (data) => { await fs.writeFile(BLOCKED_CMDS_PATH, JSON.stringify(data, null, 2)); };

const UNBLOCKABLE_COMMANDS = ['blockcmd', 'unblockcmd', 'listblocked', 'ban', 'add', 'kick', 'promover', 'demote', 'soadms'];

module.exports = async (sock, m, jid, args) => {
    const cmdToBlock = args[0]?.toLowerCase();
    if (!cmdToBlock) {
        return sock.sendMessage(jid, { text: `❓ Qual comando você quer bloquear?\n\n*Exemplo:* \`${PREFIX}blockcmd ping\`` }, { quoted: m });
    }

    if (UNBLOCKABLE_COMMANDS.includes(cmdToBlock)) {
        return sock.sendMessage(jid, { text: `❌ Este comando não pode ser bloqueado por segurança.` }, { quoted: m });
    }

    const blockedCmds = await readBlockedCmds();
    const groupBlocked = blockedCmds[jid] || [];

    if (groupBlocked.includes(cmdToBlock)) {
        return sock.sendMessage(jid, { text: `⚠️ O comando \`${cmdToBlock}\` já está bloqueado neste grupo.` }, { quoted: m });
    }

    groupBlocked.push(cmdToBlock);
    blockedCmds[jid] = groupBlocked;
    await writeBlockedCmds(blockedCmds);

    await sock.sendMessage(jid, { text: `✅ O comando \`${cmdToBlock}\` foi bloqueado para membros comuns neste grupo.` }, { quoted: m });
};