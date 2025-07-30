const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const DATA_PATH = path.resolve(__dirname, '../json/relacionamentos.json');
const PROPOSAL_TIMEOUT_SECONDS = 120;
const TEMPO_MINIMO_CASAR = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

async function readData() {
    try {
        const data = await fs.readFile(DATA_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            const initialData = { casais: {}, propostas: {} };
            await writeData(initialData);
            return initialData;
        }
        return { casais: {}, propostas: {} };
    }
}

async function writeData(data) {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

function findUserRelationship(userId, data) {
    for (const partner1 in data.casais) {
        const rel = data.casais[partner1];
        if (partner1 === userId || rel.partner === userId) {
            return { idPrincipal: partner1, ...rel };
        }
    }
    return null;
}

const command = async (sock, m, jid, args, senderId, command) => {
    try {
        if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Este comando só funciona em grupos.' }, { quoted: m });

        const data = await readData();
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const repliedTo = m.message?.extendedTextMessage?.contextInfo?.participant;
        const targetId = mentionedJid || repliedTo;

        if (command === 'pedirnamoro') {
            if (!targetId) return sock.sendMessage(jid, { text: `❌ Marque ou responda alguém para pedir em namoro.` }, { quoted: m });
            if (targetId === senderId) return sock.sendMessage(jid, { text: `❌ Você não pode namorar consigo mesmo!` }, { quoted: m });
            if (findUserRelationship(senderId, data)) return sock.sendMessage(jid, { text: '⚠️ Você já está em um relacionamento.' }, { quoted: m });
            if (findUserRelationship(targetId, data)) return sock.sendMessage(jid, { text: `⚠️ @${targetId.split('@')[0]} já está em um relacionamento.`, mentions: [targetId] }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '💌', key: m.key } });
            data.propostas[targetId] = { from: senderId, type: 'namoro', timestamp: Date.now() };
            await writeData(data);

            await sock.sendMessage(jid, {
                text: `💖 @${senderId.split('@')[0]} pediu @${targetId.split('@')[0]} em namoro!\n\nResponda com *${PREFIX}aceitar* ou *${PREFIX}recusar* dentro de *${PROPOSAL_TIMEOUT_SECONDS} segundos*.`,
                mentions: [senderId, targetId]
            });

            setTimeout(async () => {
                const updated = await readData();
                if (updated.propostas[targetId]?.from === senderId) {
                    delete updated.propostas[targetId];
                    await writeData(updated);
                    await sock.sendMessage(jid, {
                        text: `⏰ Tempo esgotado! @${targetId.split('@')[0]} não respondeu ao pedido de @${senderId.split('@')[0]}.`,
                        mentions: [senderId, targetId]
                    });
                }
            }, PROPOSAL_TIMEOUT_SECONDS * 1000);
            return;
        }

        if (command === 'casar') {
            const rel = findUserRelationship(senderId, data);
            if (!rel || rel.status !== 'namorando') {
                return sock.sendMessage(jid, { text: '❌ Você precisa estar namorando para pedir em casamento.' }, { quoted: m });
            }

            const partnerId = rel.partner === senderId ? rel.idPrincipal : rel.partner;
            const tempoNamoro = Date.now() - rel.inicio;

            if (tempoNamoro < TEMPO_MINIMO_CASAR) {
                const diasFaltando = Math.ceil((TEMPO_MINIMO_CASAR - tempoNamoro) / (1000 * 60 * 60 * 24));
                return sock.sendMessage(jid, {
                    text: `💬 Vocês ainda não podem casar! Esperem mais *${diasFaltando} dia(s)*.`,
                    mentions: [partnerId]
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { react: { text: '💍', key: m.key } });
            data.propostas[partnerId] = { from: senderId, type: 'casamento', timestamp: Date.now() };
            await writeData(data);

            await sock.sendMessage(jid, {
                text: `💍 @${senderId.split('@')[0]} pediu @${partnerId.split('@')[0]} em CASAMENTO!\n\nResponda com *${PREFIX}aceitar* ou *${PREFIX}recusar* dentro de *${PROPOSAL_TIMEOUT_SECONDS} segundos*.`,
                mentions: [senderId, partnerId]
            });

            setTimeout(async () => {
                const updated = await readData();
                if (updated.propostas[partnerId]?.from === senderId) {
                    delete updated.propostas[partnerId];
                    await writeData(updated);
                    await sock.sendMessage(jid, {
                        text: `⏰ Pedido de casamento expirado! @${partnerId.split('@')[0]} não respondeu a tempo.`,
                        mentions: [senderId, partnerId]
                    });
                }
            }, PROPOSAL_TIMEOUT_SECONDS * 1000);
            return;
        }

        if (command === 'aceitar') {
            const proposta = data.propostas[senderId];
            if (!proposta || Date.now() - proposta.timestamp > PROPOSAL_TIMEOUT_SECONDS * 1000)
                return sock.sendMessage(jid, { text: '❌ O pedido expirou ou não existe.' }, { quoted: m });

            const quemPediu = proposta.from;
            const tipo = proposta.type;

            if (tipo === 'namoro') {
                data.casais[quemPediu] = { partner: senderId, status: 'namorando', inicio: Date.now() };
                await sock.sendMessage(jid, {
                    text: `💑 Agora é oficial: @${quemPediu.split('@')[0]} ❤️ @${senderId.split('@')[0]} estão namorando!`,
                    mentions: [quemPediu, senderId]
                });
            } else if (tipo === 'casamento') {
                const rel = data.casais[quemPediu];
                if (rel?.partner !== senderId) return sock.sendMessage(jid, { text: '❌ Vocês não estão mais juntos...' }, { quoted: m });

                rel.status = 'casados';
                rel.inicio = Date.now();
                await sock.sendMessage(jid, {
                    text: `💒 Parabéns! @${quemPediu.split('@')[0]} e @${senderId.split('@')[0]} agora estão *casados*! 🎉`,
                    mentions: [quemPediu, senderId]
                });
            }

            delete data.propostas[senderId];
            await writeData(data);
            return;
        }

        if (command === 'recusar') {
            const proposta = data.propostas[senderId];
            if (!proposta) return sock.sendMessage(jid, { text: '❌ Você não tem nenhum pedido pendente.' }, { quoted: m });

            const quemPediu = proposta.from;
            const tipo = proposta.type;
            const texto = tipo === 'namoro' ? 'pedido de namoro' : 'pedido de casamento';

            await sock.sendMessage(jid, {
                text: `😔 @${senderId.split('@')[0]} recusou o ${texto} de @${quemPediu.split('@')[0]}.`,
                mentions: [senderId, quemPediu]
            });

            delete data.propostas[senderId];
            await writeData(data);
            return;
        }

        if (['terminar', 'terminarnamoro', 'divorcio'].includes(command)) {
            const rel = findUserRelationship(senderId, data);
            if (!rel) return sock.sendMessage(jid, { text: '❌ Você não está em um relacionamento.' }, { quoted: m });

            const parceiro = rel.partner;
            delete data.casais[rel.idPrincipal];

            await sock.sendMessage(jid, {
                text: `💔 @${senderId.split('@')[0]} terminou com @${parceiro.split('@')[0]}.`,
                mentions: [senderId, parceiro]
            });
            return;
        }

        if (command === 'casais') {
            if (Object.keys(data.casais).length === 0)
                return sock.sendMessage(jid, { text: '📝 Nenhum casal registrado ainda!' });

            let texto = '💞 Lista de casais:\n\n';
            for (const pessoa in data.casais) {
                const casal = data.casais[pessoa];
                if (pessoa < casal.partner) {
                    const status = casal.status === 'casados' ? '💍 Casados' : '💖 Namorando';
                    texto += `• @${pessoa.split('@')[0]} ❤️ @${casal.partner.split('@')[0]} — ${status}\n`;
                }
            }

            await sock.sendMessage(jid, { text: texto, mentions: Object.keys(data.casais).flatMap(p => [p, data.casais[p].partner]) });
        }

    } catch (e) {
        console.error('Erro no sistema de relacionamentos:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro no sistema de relacionamentos.' }, { quoted: m });
    }
};

module.exports = {
    command,
    findUserRelationship
};
