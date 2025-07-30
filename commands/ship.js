const fs = require('fs');

const createProgressBar = (value, size = 12) => {
    const percentage = value / 100;
    const progress = Math.round(size * percentage);
    const empty = size - progress;
    const progressText = '❤️'.repeat(progress);
    const emptyText = '🖤'.repeat(empty);
    return `${progressText}${emptyText}`;
};

const getShipComment = (score) => {
    if (score < 10) return "Talvez em outra encarnação... 👽";
    if (score < 25) return "É mais fácil o Vasco ganhar um título. ⚽";
    if (score < 40) return "Potencial para uma amizade sincera (e só).";
    if (score < 60) return "Hmm, tem uma química no ar! 👀";
    if (score < 75) return "Casal Fofura! O grupo aprova. 🥰";
    if (score < 90) return "Destinados! As estrelas se alinharam para vocês. ✨";
    return "PERFEITOS! Já podem encomendar as alianças! 💍";
};

module.exports = async (sock, m, jid, args, PREFIX) => {
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: 'Este comando só funciona em grupos.' }, { quoted: m });
        }
        
        const configPath = '/home/container/json/brincadeiras_config.json';
        
        try {
            if (fs.existsSync(configPath)) {
                const configData = fs.readFileSync(configPath, 'utf8');
                const config = JSON.parse(configData);

                if (!config[jid] || config[jid].enabled !== true) {
                    await sock.sendMessage(jid, { text: '🚫 As brincadeiras estão desativadas neste grupo.' }, { quoted: m });
                    return;
                }
            } else {
                console.error(`Arquivo de configuração não encontrado em: ${configPath}`);
                return;
            }
        } catch (error) {
            console.error('Erro ao ler ou analisar o arquivo de configuração de brincadeiras:', error);
            return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao verificar as permissões deste grupo.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '💘 Analisando o destino... Cruzando os dados astrais... ✨' }, { quoted: m });

        const metadata = await sock.groupMetadata(jid);
        const participants = metadata.participants;
        const botJid = sock.user.id.replace(/:.*$/, "") + "@s.whatsapp.net";
        const eligibleParticipants = participants.filter(p => p.id !== botJid);

        if (eligibleParticipants.length < 2) {
            return sock.sendMessage(jid, { text: 'Precisa haver pelo menos 2 pessoas no grupo para eu poder shipar!' }, { quoted: m });
        }

        let user1, user2;
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const sender = m.key.participant || m.sender; // Garante que temos o JID do remetente

        if (mentions.length >= 2) {
            user1 = participants.find(p => p.id === mentions[0]);
            user2 = participants.find(p => p.id === mentions[1]);
        } else if (mentions.length === 1) {
            user1 = participants.find(p => p.id === mentions[0]);
            const otherParticipants = eligibleParticipants.filter(p => p.id !== user1.id);
            user2 = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
        } else {
            const [p1, p2] = eligibleParticipants.sort(() => 0.5 - Math.random()).slice(0, 2);
            user1 = p1;
            user2 = p2;
        }
        
        if (!user1 || !user2 || user1.id === user2.id) {
             return sock.sendMessage(jid, { text: 'Não consegui encontrar um par válido. Tente de novo!' }, { quoted: m });
        }

        const num1 = parseInt(user1.id.replace(/[^0-9]/g, ''));
        const num2 = parseInt(user2.id.replace(/[^0-9]/g, ''));
        const shipScore = (num1 + num2) % 101;

        // ======================= INÍCIO DA CORREÇÃO =======================
        // Esta função auxiliar obtém o nome da forma correta.
        const getDisplayName = (userJid) => {
            if (userJid === sender) {
                // Se o usuário for quem enviou o comando, o `pushName` está disponível.
                return m.pushName || userJid.split('@')[0];
            }
            // Para outros usuários, usamos o número como fallback. O @-mention na mensagem final
            // irá mostrar o nome de contato correto para cada pessoa no grupo.
            return userJid.split('@')[0];
        };

        const name1 = getDisplayName(user1.id);
        const name2 = getDisplayName(user2.id);
        // ======================== FIM DA CORREÇÃO =========================
        
        const shipName = name1.slice(0, Math.ceil(name1.length / 2)).trim() + name2.slice(Math.floor(name2.length / 2)).toLowerCase().trim();

        const progressBar = createProgressBar(shipScore);
        const comment = getShipComment(shipScore);

        const shipMessage = `
╔═══════「 ❤️ 」═══════╗
     ✨ *O DESTINO UNIU* ✨
 
 O cupido apontou suas flechas para:
  
  💘 *@${user1.id.split('@')[0]}*
           e
  💘 *@${user2.id.split('@')[0]}*

 Formando o casal com o nome de:
 📛 *${shipName}*
 
 *Nível de Compatibilidade:*
    *${shipScore}%*
 ${progressBar}

 *Veredito do Cupido:*
 ${comment}
╚═══════「 ❤️ 」═══════╝
        `;

        await sock.sendMessage(
            jid,
            { 
                text: shipMessage.trim(),
                mentions: [user1.id, user2.id]
            },
            { quoted: m }
        );

    } catch (e) {
        console.error('Erro no comando ship:', e);
        sock.sendMessage(jid, { text: '❌ Ocorreu um erro cósmico ao tentar formar o casal.' }, { quoted: m });
    }
};