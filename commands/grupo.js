module.exports = async (sock, m, jid, comando) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    // Verifica se é um grupo
    if (!m.key.remoteJid.endsWith('@g.us')) {
        return reply('❌ Esse comando só funciona em grupos.');
    }

    // Busca os metadados do grupo
    const metadata = await sock.groupMetadata(jid);

    // Verifica se o autor é admin
    const isAdmin = metadata.participants.some(p => p.id === m.key.participant && ['admin', 'superadmin'].includes(p.admin));
    if (!isAdmin) {
        return reply('❌ Apenas administradores podem usar este comando.');
    }

    // Verifica se o bot é admin
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const botIsAdmin = metadata.participants.some(p => p.id === botNumber && ['admin', 'superadmin'].includes(p.admin));
    if (!botIsAdmin) {
        return reply('❌ Eu preciso ser administrador do grupo para isso.');
    }

    try {
        if (comando === 'fechar') {
            await sock.groupSettingUpdate(jid, 'announcement'); // Apenas admins
            reply('🔒 O grupo foi fechado. Apenas administradores podem enviar mensagens.');
        } else if (comando === 'abrir') {
            await sock.groupSettingUpdate(jid, 'not_announcement'); // Todos podem
            reply('🔓 O grupo foi aberto. Todos os membros podem enviar mensagens.');
        } else {
            reply('❓ Comando inválido. Use !fechar ou !abrir');
        }
    } catch (e) {
        console.error('[grupo] Erro:', e);
        reply('❌ Ocorreu um erro ao alterar as configurações do grupo.');
    }
};
