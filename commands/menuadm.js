// commands/menuadm.js

const { PREFIX } = require('../config');

const command = async (sock, m, jid) => {
    try {
        // Reage à mensagem do admin para dar feedback
        await sock.sendMessage(jid, { react: { text: '🛠️', key: m.key } });

        const menuAdmText = `
╭───⌈ 👑 *MENU DE ADMINISTRADOR* ⌋
│
│ *Bem-vindo, Admin!*
│ *Abaixo estão as ferramentas de gerenciamento.*
│
├─ ⋅ ❉ *Moderação de Membros* ❉ ⋅ ─
│
│ ➕ *${PREFIX}add <número>*
│    _(Adiciona um membro)_
│
│ 🚫 *${PREFIX}ban @membro*
│    _(Bane e remove um membro)_
│ 
│ 🚫 *${PREFIX}banall*
│    _(Bane todos)_
│
│ 👑 *${PREFIX}promover @membro*
│    _(Torna um membro admin)_
│
│ 🚫 *${PREFIX}mute2 & unmute2
│
│ 👤 *${PREFIX}demote @membro*
│    _(Remove o admin de um membro)_
│
│ 👤 *${PREFIX}listanegra
│
├─ ⋅ ❉ *Gerenciamento de Grupo* ❉ ⋅ ─
│
│ 📢 *${PREFIX}marcarall*
│    _(Menciona todos no grupo)_
│ 
│ 📢 *${PREFIX}hidetag [texto]*
│    _(Menciona todos no grupo invisivel)_
│
│
│ 🖼️ *${PREFIX}seticon <respondendo img>*
│    _(Define o ícone do grupo)_
│
│ 🔐 *${PREFIX}abrir* / *${PREFIX}fechar*
│    _(Abre ou fecha o grupo)_
│
│ 🗑️ *${PREFIX}d <respondendo msg>*
│    _(Apaga a mensagem do bot)_
│
│ 📊 *${PREFIX}groupstats*
│    _(Vê as estatísticas do grupo)_
│
├─ ⋅ ❉ *Sistemas (On/Off)* ❉ ⋅ ─
│
│ 🔗 *${PREFIX}antilink on | off*
│ 🤫 *${PREFIX}soadms on | off*
│ 🕵️ *${PREFIX}x9 on | off*
│ 🎉 *${PREFIX}welcome on | off*
│ 🧠 *${PREFIX}autoresposta on | off*
│ 🎲 *${PREFIX}brincadeiras on | off*
│ 👽 *${PREFIX}antifake on | off*
│ 👽 *${PREFIX}autosticker
│ 👽 *${PREFIX}welcome /setwelcome/setgoodbye
│
├─ ⋅ ❉ *Brincadeiras de Admin* ❉ ⋅ ─
│
│ 💀 *${PREFIX}roletarussa*
│    _(Remove um membro aleatório)_
│
│ ⚔️ *${PREFIX}duelo @p1 vs @p2*
│    _(Inicia uma votação de duelo)_
│
│ 🗳️ *${PREFIX}encerrarvoto*
│    _(Finaliza a votação do duelo)_
│
│ 🗳️ *${PREFIX}blockcmd
│ 🗳️ *${PREFIX}unblockcmd
│ 🗳️ *${PREFIX}listblocked
╰───────────────

adminCommands = ['ban', 'fechar', 'abrir', 'marcarall', 'add', 'promover', 'welcome', 'setwelcome', 'demote', 'mute', 'unmute', 'x9', 'groupstats', 'banall', 'soadms', 'brincadeiras', 'limpar', 'sorteio', 'antilink', 'd', 'seticon', 'simi', 'quiz', 'roletarussa', 'menuadm']
        `.trim();

        await sock.sendMessage(jid, { text: menuAdmText }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando menuadm:", e);
    }
};

module.exports = command;