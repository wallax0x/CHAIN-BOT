// commands/topativos.js (VERSÃO FINAL À PROVA DE FALHAS)

const fs = require('fs').promises;
const path = require('path');
const { getUserXp } = require('../utils/xp_manager');

const STATS_PATH = path.resolve(__dirname, '../json/group_stats.json');

const readStats = async () => { try { const d = await fs.readFile(STATS_PATH, 'utf8'); return JSON.parse(d); } catch { return {}; } };

const command = async (sock, m, jid) => {
    const reply = (text) => sock.sendMessage(jid, { text }, { quoted: m });

    if (!jid.endsWith('@g.us')) {
        return reply('❌ Este comando só funciona em grupos.');
    }

    let statusMsg;

    try {
        await sock.sendMessage(jid, { react: { text: '🏆', key: m.key } });
        statusMsg = await sock.sendMessage(jid, { text: '📊 Calculando o ranking de atividade do grupo...' }, { quoted: m });

        const [stats, metadata] = await Promise.all([
            readStats(),
            sock.groupMetadata(jid)
        ]);
        
        const groupStats = stats[jid];

        if (!groupStats || Object.keys(groupStats).length < 1) {
            return await sock.sendMessage(jid, { text: '📈 Ainda não tenho dados de atividade suficientes para este grupo.', edit: statusMsg.key });
        }

        const userArray = await Promise.all(
            Object.entries(groupStats).map(async ([userId, data]) => {
                const userXpData = await getUserXp(userId);
                return {
                    jid: userId,
                    ...data,
                    level: userXpData.level || 1,
                    score: (data.msg * 1) + (data.cmd * 3) + (data.figu * 5)
                };
            })
        );

        userArray.sort((a, b) => b.score - a.score);

        // ✅ CORREÇÃO: Alterado para mostrar o Top 10
        const topUsers = userArray.slice(0, 5);

        const groupName = metadata.subject;
        let rankMessage = `*🏆 RANKING DE ATIVIDADE 🏆*\n       「 _${groupName}_ 」\n\n`;
        const medals = ['🥇', '🥈', '🥉'];
        let mentions = [];

        // ✅ CORREÇÃO: Adicionado try...catch DENTRO do loop
        topUsers.forEach((user, index) => {
            try {
                // Se o índice for menor que 3, usa uma medalha. Senão, usa o número.
                const position = index < 3 ? medals[index] : `${index + 1}º`;
                const userName = `@${user.jid.split('@')[0]}`;
                const participant = metadata.participants.find(p => p.id === user.jid);

                // Se o participante não for encontrado no grupo, pula para o próximo
                if (!participant) {
                    console.log(`[TopAtivos] Usuário ${user.jid} não encontrado nos participantes do grupo, pulando.`);
                    return;
                }
                
                mentions.push(user.jid);
                const cargo = participant.admin === 'superadmin' ? '👑 Dono(a)' : (participant.admin === 'admin' ? '🛡️ Admin' : '👤 Membro');

                rankMessage += `*${position} ${userName}*\n`;
                rankMessage += `│  Lvl: *${user.level}* | ${cargo}\n`;
                rankMessage += `│  Score de Atividade: *${user.score}*\n`;
                rankMessage += `└─ 💬 Msgs: ${user.msg} | 🤖 Cmds: ${user.cmd} | 🎨 Figus: ${user.figu}\n\n`;

            } catch (loopError) {
                // Se der erro em um usuário, loga o erro e continua o loop
                console.error(`[TopAtivos] Erro ao processar o usuário no ranking: ${user.jid}`, loopError);
            }
        });

        if (mentions.length === 0) {
            return await sock.sendMessage(jid, { text: '📈 Não consegui gerar o ranking, parece que os membros mais ativos já saíram do grupo.', edit: statusMsg.key });
        }

        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
        await sock.sendMessage(jid, { text: rankMessage, mentions, edit: statusMsg.key });

    } catch (e) {
        console.error("Erro no comando topativos:", e);
        if (statusMsg) {
            await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao gerar o ranking.', edit: statusMsg.key });
        } else {
            reply('❌ Ocorreu um erro ao gerar o ranking.');
        }
    }
};

module.exports = command;