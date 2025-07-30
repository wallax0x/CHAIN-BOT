module.exports = async (sock, m, jid) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    if (!jid.endsWith('@g.us')) {
        return reply('❌ Este comando só pode ser usado em grupos.');
    }

    const metadata = await sock.groupMetadata(jid);
    const admins = metadata.participants.filter(p => p.admin !== null).map(p => p.id);

    if (!admins.includes(m.key.participant)) {
        return reply('❌ Apenas administradores podem usar este comando.');
    }

    try {
        await sock.sendMessage(jid, { text: '🧹 Limpando o chat, aguarde...' }, { quoted: m });

        const invisibleChar = String.fromCharCode(0x200B); // caractere invisível
        const blankLines = Array(250).fill(invisibleChar).join('\n'); // 250 linhas em branco

        // Envia a primeira "borrada" de linhas
        await sock.sendMessage(jid, { text: blankLines }, { quoted: m });

        // Reforça o "limpeza" com mais uma rodada
        await sock.sendMessage(jid, { text: blankLines }, { quoted: m });

        // Mensagem final
        await sock.sendMessage(jid, {
            text: '✅ Chat limpo com sucesso!\n(visível apenas para quem rolou a tela).',
            quoted: m
        });

    } catch (e) {
        console.error('Erro no comando limpar:', e);
        return sock.sendMessage(jid, {
            text: '❌ Ocorreu um erro ao tentar limpar o chat. Tente novamente mais tarde.',
            quoted: m
        });
    }
};
