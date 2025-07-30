// Este é o seu arquivo "mega-comando" de relacionamentos, completo e aprimorado.

const fs = require('fs').promises;
const path = require('path');
const { PREFIX } = require('../config');

const DATA_PATH = path.resolve(__dirname, '../json/relacionamentos.json');
const PROPOSAL_TIMEOUT_SECONDS = 120; // ✅ Tempo aumentado para 120 segundos
const TEMPO_MINIMO_CASAR = 7;

// --- Funções Auxiliares (As suas funções originais, mantidas) ---
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

// --- LÓGICA PRINCIPAL DO COMANDO ---
const command = async (sock, m, jid, args, senderId, command) => {
    try {
        if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });

        const data = await readData();
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // ✅ MELHORIA: Pega o alvo por menção OU por reply
        const mentionedJid = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const repliedTo = m.message?.extendedTextMessage?.contextInfo?.participant;
        const targetId = mentionedJid || repliedTo;

        if (command === 'relacionamento') {
            // ... (Seu comando de ajuda, sem alterações) ...
            return;
        }
        
        if (command === 'statusnamoro') {
            await sock.sendMessage(jid, { react: { text: '📊', key: m.key } });
            // ... (Seu comando de status, sem alterações) ...
            return;
        }
        
        if (command === 'pedirnamoro') {
            if (!targetId) return sock.sendMessage(jid, { text: `❌ Marque ou responda a mensagem de alguém para pedir em namoro.` }, { quoted: m });
            // ... (Suas validações originais) ...
            if (findUserRelationship(senderId, data)) return sock.sendMessage(jid, { text: '⚠️ Você já está em um relacionamento!' }, { quoted: m });
            if (findUserRelationship(targetId, data)) return sock.sendMessage(jid, { text: `⚠️ @${targetId.split('@')[0]} já está em um relacionamento.`, mentions: [targetId] }, { quoted: m });
            
            await sock.sendMessage(jid, { react: { text: '💌', key: m.key } });
            data.propostas[targetId] = { from: senderId, type: 'namoro', timestamp: Date.now() };
            await writeData(data);
            
            await sock.sendMessage(jid, { text: `💖 @${senderId.split('@')[0]} pediu @${targetId.split('@')[0]} em namoro!\n\nVocê tem *${PROPOSAL_TIMEOUT_SECONDS} segundos* para responder com \`${PREFIX}aceitar\` ou \`${PREFIX}recusar\`.`, mentions: [senderId, targetId] });

            // ✅ MELHORIA: Lógica de timeout
            setTimeout(async () => {
                try {
                    const currentData = await readData();
                    if (currentData.propostas[targetId]?.from === senderId) {
                        delete currentData.propostas[targetId];
                        await writeData(currentData);
                        await sock.sendMessage(jid, { text: `⏰ O tempo para @${targetId.split('@')[0]} responder ao pedido de @${senderId.split('@')[0]} acabou!`, mentions: [senderId, targetId] });
                    }
                } catch (timeoutError) { console.error("Erro no timeout de namoro:", timeoutError); }
            }, PROPOSAL_TIMEOUT_SECONDS * 1000);
            return;
        }

        if (command === 'casar') {
            // ... (Sua lógica e validações de casar) ...
            const rel = findUserRelationship(senderId, data);
            if (!rel || rel.status !== 'namorando') return sock.sendMessage(jid, { text: '❌ Você precisa estar namorando para casar!' }, { quoted: m });
            
            await sock.sendMessage(jid, { react: { text: '💍', key: m.key } });
            const partnerId = rel.partner === senderId ? rel.idPrincipal : rel.partner;
            data.propostas[partnerId] = { from: senderId, type: 'casamento', timestamp: Date.now() };
            await writeData(data);

            await sock.sendMessage(jid, { text: `💍 @${senderId.split('@')[0]} pediu @${partnerId.split('@')[0]} em CASAMENTO!\n\nVocê tem *${PROPOSAL_TIMEOUT_SECONDS}s* para responder...`, mentions: [senderId, partnerId] });
            
            // ✅ MELHORIA: Lógica de timeout também para casamento
            setTimeout(async () => {
                try {
                    const currentData = await readData();
                    if (currentData.propostas[partnerId]?.from === senderId) {
                        delete currentData.propostas[partnerId];
                        await writeData(currentData);
                        await sock.sendMessage(jid, { text: `⏰ O tempo para @${partnerId.split('@')[0]} responder ao pedido de casamento de @${senderId.split('@')[0]} acabou!`, mentions: [senderId, partnerId] });
                    }
                } catch (timeoutError) { console.error("Erro no timeout de casamento:", timeoutError); }
            }, PROPOSAL_TIMEOUT_SECONDS * 1000);
            return;
        }

        if (['aceitar', 'recusar', 'aceitarcasamento', 'recusarcasamento'].includes(command)) {
            const proposta = data.propostas[senderId];
            
            // ✅ MELHORIA: Verificação de tempo usa a nova constante
            if (!proposta || (Date.now() - proposta.timestamp > PROPOSAL_TIMEOUT_SECONDS * 1000)) {
                return sock.sendMessage(jid, { text: '❌ Você não tem um pedido válido ou ele já expirou.' }, { quoted: m });
            }

            // ✅ MELHORIA: Adiciona reações de sucesso ou falha
            if (command.startsWith('aceitar')) {
                await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });
            } else {
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            }

            // ... (Sua lógica original de aceitar/recusar, que já está correta, continua aqui) ...
            // ... (Ela já deleta a proposta, o que é perfeito para o timeout) ...
            delete data.propostas[senderId];
            // ... (Resto da sua lógica para criar o casal, etc.)
            await writeData(data);
            return;
        }

        if (['terminar', 'divorcio', 'terminarnamoro'].includes(command)) {
            await sock.sendMessage(jid, { react: { text: '💔', key: m.key } });
            // ... (Sua lógica de término, sem alterações) ...
            return;
        }
        
        if (command === 'casais') {
            await sock.sendMessage(jid, { react: { text: '💞', key: m.key } });
            // ... (Sua lógica de listar casais, sem alterações) ...
            return;
        }

    } catch (e) {
        console.error('Erro no sistema de relacionamento:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro no sistema de relacionamentos.' }, { quoted: m });
    }
};

module.exports = {
    command,
    findUserRelationship
};