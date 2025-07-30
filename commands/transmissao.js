// home/container/commands/transmissao.js

const { OWNER_JID } = require('../config');

// Função de delay para evitar banimento
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const command = async (sock, m, jid, args, PREFIX, store) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    // 1. VERIFICAÇÃO DE AUTORIZAÇÃO
    const sender = m.key.remoteJid.endsWith('@g.us') ? m.key.participant : m.key.remoteJid;
    if (sender !== OWNER_JID) {
        await sock.sendMessage(jid, { react: { text: '🚫', key: m.key } });
        return reply('❌ Este comando é restrito ao dono do bot.');
    }

    // 2. PARSE DA MENSAGEM E DO ALVO
    const fullInput = args.join(' ');
    const parts = fullInput.split('|');
    const broadcastMessage = parts[0].trim();
    // Define 'grupos' como padrão se nenhum alvo for especificado
    const target = parts[1] ? parts[1].trim().toLowerCase() : 'grupos';

    if (!broadcastMessage) {
        const example = `*Exemplos de uso:*\n\n` +
                        `\`${PREFIX}transmissao Olá a todos!\`\n_(Envia para grupos por padrão)_\n\n` +
                        `\`${PREFIX}transmissao Aviso importante | membros\`\n_(Envia para membros no privado)_`;
        return reply(`❓ Forneça uma mensagem e, opcionalmente, um alvo.\n\n${example}`);
    }

    // 3. SELEÇÃO DA LISTA DE JIDs (ALVOS)
    let jidList = [];
    let targetType = '';

    if (target === 'membros') {
        if (!store) {
            return reply('❌ A transmissão para membros requer que o `store` do bot esteja configurado.');
        }
        targetType = 'Membros (Privado)';
        const chats = store.chats.all();
        jidList = chats.filter(chat => !chat.id.endsWith('@g.us')).map(chat => chat.id);
    } else { // Padrão é 'grupos'
        targetType = 'Grupos';
        try {
            jidList = Object.keys(await sock.groupFetchAllParticipating());
        } catch (e) {
            console.error("Erro ao buscar a lista de grupos:", e);
            return reply('❌ Falha ao obter a lista de grupos.');
        }
    }

    if (jidList.length === 0) {
        return reply(`⚠️ Nenhum alvo encontrado para a categoria "${targetType}".`);
    }

    // 4. MENSAGEM DE CONFIRMAÇÃO ESTILIZADA
    const estimatedSeconds = jidList.length * 15; // Média de 15 segundos por mensagem
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
    const startTime = Date.now();

    const confirmationMsg = `*╔═══════════════╗*\n` +
                          `*║ 📢 TRANSMISSÃO INICIADA 📢 ║*\n` +
                          `*╚═══════════════╝*\n\n` +
                          `*🎯 Alvo:* ${targetType}\n` +
                          `*👥 Total de envios:* ${jidList.length}\n` +
                          `*⏳ Tempo estimado:* Aprox. ${estimatedMinutes} minuto(s)\n\n` +
                          `Você receberá o relatório final ao concluir.`;

    await sock.sendMessage(jid, { react: { text: '📢', key: m.key } });
    await reply(confirmationMsg);

    // 5. LOOP DE ENVIO COM MENSAGEM ESTILIZADA
    let successCount = 0;
    let failCount = 0;

    const messageToSend = `*╔═════ 📢 Comunicado 📢 ═════╗*\n\n` +
                        `${broadcastMessage}\n\n` +
                        `*╚════════════════════════╝*\n` +
                        `_Esta é uma mensagem automática do bot._`;

    for (const targetJid of jidList) {
        try {
            await sock.sendMessage(targetJid, { text: messageToSend });
            successCount++;
        } catch (e) {
            console.error(`Falha ao enviar para ${targetJid}:`, e);
            failCount++;
        }
        const randomDelay = Math.floor(Math.random() * (20000 - 7000 + 1)) + 7000; // 7-20 segundos
        await delay(randomDelay);
    }

    // 6. RELATÓRIO FINAL ESTILIZADO
    const endTime = Date.now();
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);
    const durationMinutes = (durationSeconds / 60).toFixed(2);

    const reportMsg = `*╔═══════════════╗*\n` +
                      `*║ 📊 RELATÓRIO FINAL 📊 ║*\n` +
                      `*╚═══════════════╝*\n\n` +
                      `*Transmissão concluída!*\n\n` +
                      `*✅ Sucessos:* ${successCount}\n` +
                      `*❌ Falhas:* ${failCount}\n` +
                      `*⏰ Duração total:* ${durationMinutes} minutos (${durationSeconds} segundos)`;
    
    await reply(reportMsg);
};

module.exports = command;