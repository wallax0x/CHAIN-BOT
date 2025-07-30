// commands/marcarall.js (VERSÃO SIMPLIFICADA - SÓ MARCAÇÃO COM @)

module.exports = async (sock, m, jid) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    if (!jid.endsWith('@g.us')) {
        return reply('❌ Este comando só pode ser usado em grupos.');
    }

    try {
        const metadata = await sock.groupMetadata(jid);
        const admins = metadata.participants.filter(p => p.admin !== null).map(p => p.id);
        const sender = m.key.participant || m.key.remoteJid;

        // 1. Verifica se o remetente é um admin do grupo
        if (!admins.includes(sender)) {
            return reply('❌ Apenas administradores podem usar este comando.');
        }

        await sock.sendMessage(jid, { react: { text: '📣', key: m.key } });

        // 2. Prepara a mensagem e a lista de menções
        let text = '📢 *Atenção, pessoal! Chamando todos os membros:*\n\n';
        const mentions = [];

        for (let participant of metadata.participants) {
            const jid = participant.id;
            mentions.push(jid);
            // Adiciona o @ com o número na mensagem de texto
            text += `▸ @${jid.split('@')[0]}\n`;
        }
        
        // 3. Envia a mensagem final com o texto e as menções
        await sock.sendMessage(jid, {
            text: text.trim(),
            mentions: mentions
        });

    } catch (e) {
        console.error("Erro no comando marcarall:", e);
        reply('❌ Ocorreu um erro inesperado ao tentar marcar todos.');
    }
};