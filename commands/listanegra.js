// commands/listanegra.js
const fs = require('fs');
const path = require('path');
const { PREFIX } = require('../config.js');

const blacklistPath = path.join(__dirname, '..', 'data', 'blacklist.json');

const readBlacklist = () => {
    try {
        const data = fs.readFileSync(blacklistPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeBlacklist = (data) => {
    fs.writeFileSync(blacklistPath, JSON.stringify(data, null, 2));
};

const command = async (sock, m, jid, args) => {
    try {
        const groupMetadata = await sock.groupMetadata(jid);
        const senderId = m.key.participant || m.key.remoteJid;
        const sender = groupMetadata.participants.find(p => p.id === senderId);

        if (!sender || (sender.admin !== 'admin' && sender.admin !== 'superadmin')) {
            return sock.sendMessage(jid, { text: '❌ Apenas administradores do grupo podem usar este comando.' }, { quoted: m });
        }

        const subCommand = args[0]?.toLowerCase();
        
        // --- LÓGICA DE DETECÇÃO DO ALVO (Menção ou Número) ---
        let target = null;
        const mentionedJid = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (mentionedJid) {
            // Prioridade 1: Pega o alvo pela menção
            target = mentionedJid;
        } else {
            // Prioridade 2: Pega o alvo pelo número no texto (ignora o sub-comando 'add'/'remover')
            const numberArg = args[1];
            if (numberArg) {
                // Remove caracteres não numéricos (espaços, +, -, etc.)
                const cleanedNumber = numberArg.replace(/\D/g, '');
                if (cleanedNumber) {
                    target = `${cleanedNumber}@s.whatsapp.net`;
                }
            }
        }

        if (!subCommand || (subCommand !== 'add' && subCommand !== 'remover')) {
            const helpMsg = `🚫 *Comando: Lista Negra*\n\nUse para impedir que um usuário entre no grupo.\n\n*Formatos:*\n\`${PREFIX}listanegra add @usuario\`\n\`${PREFIX}listanegra add 55XX912345678\`\n\n\`${PREFIX}listanegra remover @usuario\`\n\`${PREFIX}listanegra remover 55XX912345678\``;
            return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
        }
        
        if (!target) {
            return sock.sendMessage(jid, { text: `⚠️ Você precisa mencionar um usuário OU fornecer um número de telefone.` }, { quoted: m });
        }

        let blacklist = readBlacklist();

        if (subCommand === 'add') {
            if (blacklist.includes(target)) {
                return sock.sendMessage(jid, { text: '✅ Este usuário já está na lista negra.' }, { quoted: m });
            }
            blacklist.push(target);
            writeBlacklist(blacklist);
            await sock.sendMessage(jid, { text: `✅ Usuário @${target.split('@')[0]} foi adicionado à lista negra.` }, { quoted: m, mentions: [target] });
        } else if (subCommand === 'remover') {
            if (!blacklist.includes(target)) {
                return sock.sendMessage(jid, { text: '❌ Este usuário não está na lista negra.' }, { quoted: m });
            }
            blacklist = blacklist.filter(id => id !== target);
            writeBlacklist(blacklist);
            await sock.sendMessage(jid, { text: `✅ Usuário @${target.split('@')[0]} foi removido da lista negra.` }, { quoted: m, mentions: [target] });
        }

    } catch (e) {
        console.error("Erro no comando listanegra:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar o comando.' }, { quoted: m });
    }
};

module.exports = command;