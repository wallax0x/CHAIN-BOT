// commands/roletarussa.js
const { PREFIX } = require('../config');

// Função de delay para criar o suspense
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const command = async (sock, m, jid, args, senderId) => {
    // A verificação de admin já será feita no commandHandler

    try {
        const metadata = await sock.groupMetadata(jid);
        
        // Verifica se o bot é admin no grupo
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botIsAdmin = !!metadata.participants.find(p => p.id === botId)?.admin;
        if (!botIsAdmin) {
            return sock.sendMessage(jid, { text: '❌ Eu preciso ser um administrador para executar esta roleta!' }, { quoted: m });
        }

        // --- INÍCIO DA LÓGICA DE SUSPENSE ---
        let suspenseMessage = `
😈 *ROLETARUSSA INICIADA* 😈

O tambor está girando...
Um membro aleatório será removido em 10 segundos!
Quem será o azarado?
        `.trim();
        await sock.sendMessage(jid, { text: suspenseMessage }, { quoted: m });
        
        await delay(3000); // Espera 3 segundos
        await sock.sendMessage(jid, { text: '🔫 Girando o tambor...' }, { quoted: m });
        
        await delay(3000); // Espera mais 3 segundos
        await sock.sendMessage(jid, { text: '🤔 Apontando para um membro aleatório...' }, { quoted: m });

        await delay(4000); // Espera os 4 segundos finais

        // --- LÓGICA DE SORTEIO E REMOÇÃO ---
        
        // Pega todos os membros que NÃO são admins
        const members = metadata.participants.filter(p => !p.admin);

        if (members.length === 0) {
            return sock.sendMessage(jid, { text: '😅 Ufa! Parece que todos aqui são administradores. Ninguém pode ser removido.' }, { quoted: m });
        }
        
        // Sorteia um membro aleatório da lista de não-admins
        const victim = members[Math.floor(Math.random() * members.length)];
        const victimId = victim.id;

        // Caso especial: o admin que deu o comando foi o "sorteado" entre os membros comuns
        if (victimId === senderId) {
            const suicideMessage = `
💥 *BANG!* 💥

O destino é irônico! @${senderId.split('@')[0]} iniciou a roleta, pegou a arma... e atirou na própria cabeça!

_Ele(a) será removido(a) do grupo._
            `.trim();
            await sock.sendMessage(jid, { text: suicideMessage, mentions: [senderId] }, { quoted: m });
        } else {
            const resultMessage = `
💥 *BANG!* 💥

A roleta parou e o azarado da vez foi... *@${victimId.split('@')[0]}*!

_Adeus! Ele(a) será removido(a) do grupo._
            `.trim();
            await sock.sendMessage(jid, { text: resultMessage, mentions: [victimId] }, { quoted: m });
        }
        
        // Remove o membro sorteado do grupo
        await sock.groupParticipantsUpdate(jid, [victimId], 'remove');

    } catch (e) {
        console.error("Erro no comando roletarussa:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao executar a roleta.' }, { quoted: m });
    }
};

module.exports = command;