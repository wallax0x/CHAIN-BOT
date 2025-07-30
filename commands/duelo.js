// commands/duelo.js (VERSÃO CORRIGIDA)
const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const DUELS_PATH = path.resolve(__dirname, '..', 'json', 'duels.json');

async function readDuels() {
    try {
        const data = await fs.readFile(DUELS_PATH, 'utf8');
        return data ? JSON.parse(data) : {};
    } catch { return {}; }
}
async function writeDuels(data) {
    await fs.writeFile(DUELS_PATH, JSON.stringify(data, null, 2));
}

const command = async (sock, m, jid, args, senderId, isSenderAdmin, comando) => {
    try {
        if (!isSenderAdmin) return sock.sendMessage(jid, { text: '❌ Apenas admins podem gerenciar duelos.' }, { quoted: m });

        const duels = await readDuels();
        const botNumber = sock.user.id.split(':')[0];

        // --- LÓGICA PARA ENCERRAR A VOTAÇÃO ---
        if (comando === 'encerrarvoto') {
            const duel = duels[jid];
            if (!duel?.isActive) return sock.sendMessage(jid, { text: '⚠️ Não há um duelo ativo para encerrar.' }, { quoted: m });

            const votes1 = duel.duelist1.votes.length;
            const votes2 = duel.duelist2.votes.length;
            
            let resultMessage = `*VOTAÇÃO ENCERRADA!* 🗳️\n\n`;
            resultMessage += `*${duel.duelist1.name}:* ${votes1} voto(s)\n`;
            resultMessage += `*${duel.duelist2.name}:* ${votes2} voto(s)\n\n`;

            let winnerId = null;
            if (votes1 > votes2) {
                winnerId = duel.duelist1.id;
                resultMessage += `🏆 O grande vencedor(a) é... *@${winnerId.split('@')[0]}*! Parabéns!`;
            } else if (votes2 > votes1) {
                winnerId = duel.duelist2.id;
                resultMessage += `🏆 O grande vencedor(a) é... *@${winnerId.split('@')[0]}*! Parabéns!`;
            } else {
                resultMessage += `⚖️ Deu empate! Não temos um vencedor desta vez.`;
            }

            delete duels[jid];
            await writeDuels(duels);
            return sock.sendMessage(jid, { text: resultMessage, mentions: [duel.duelist1.id, duel.duelist2.id] });
        }
        
        // --- LÓGICA PARA INICIAR O DUELO ---
        if (comando === 'duelo') {
            const mentionedJids = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentionedJids.length !== 2 || !args.map(arg => arg.toLowerCase()).includes('vs')) {
                return sock.sendMessage(jid, { text: `❓ Uso incorreto. Use ${PREFIX}duelo @pessoa1 vs @pessoa2` }, { quoted: m });
            }

            if (duels[jid]?.isActive) return sock.sendMessage(jid, { text: '⚠️ Um duelo já está em andamento neste grupo.' }, { quoted: m });

            const [duelist1Id, duelist2Id] = mentionedJids;

            // CORREÇÃO 1: A função para pegar nome não existe, buscamos o nome salvo pelo WhatsApp
            // O '.pushName' vem da mensagem de quem INICIOU o duelo, não dos mencionados.
            // Para pegar os nomes dos mencionados, teríamos que fazer uma lógica mais complexa.
            // Por enquanto, vamos usar os números para garantir o funcionamento.
            const duelist1Name = duelist1Id.split('@')[0];
            const duelist2Name = duelist2Id.split('@')[0];
            
            const keyword1 = `voto_${Date.now()}_1`;
            const keyword2 = `voto_${Date.now()}_2`;

            duels[jid] = {
                isActive: true,
                duelist1: { id: duelist1Id, name: duelist1Name, votes: [], voteKeyword: keyword1 },
                duelist2: { id: duelist2Id, name: duelist2Name, votes: [], voteKeyword: keyword2 }
            };
            await writeDuels(duels);

            // CORREÇÃO 2: Codifica o texto do link para o formato de URL correto
            const voteText1 = `.voto ${keyword1}`;
            const voteText2 = `.voto ${keyword2}`;
            const voteLink1 = `https://wa.me/${botNumber}?text=${encodeURIComponent(voteText1)}`;
            const voteLink2 = `https://wa.me/${botNumber}?text=${encodeURIComponent(voteText2)}`;
            
            const duelMessage = `
*🔥 QUE COMECE O DUELO! 🔥*

Entre:
*@${duelist1Name}* ⚔️ *@${duelist2Name}*

---
*PARA VOTAR EM @${duelist1Name}:*
🔗 ${voteLink1}

*PARA VOTAR EM @${duelist2Name}:*
🔗 ${voteLink2}
---

A votação está aberta! Use \`${PREFIX}encerrarvoto\` para ver o resultado.
            `.trim();
            
            return sock.sendMessage(jid, { text: duelMessage, mentions: [duelist1Id, duelist2Id] });
        }

    } catch (e) {
        console.error("Erro no comando duelo:", e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar o comando de duelo.' }, { quoted: m });
    }
};

module.exports = {
    command: command,
    readDuels: readDuels,
    writeDuels: writeDuels
};