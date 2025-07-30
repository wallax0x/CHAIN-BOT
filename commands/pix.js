// commands/pix.js

const { readCoins, writeCoins } = require('../utils/coin_manager');
const { PREFIX } = require('../config');

const command = async (sock, m, jid, args, senderId) => {
    try {
        // --- 1. Validação dos Argumentos ---
        const mentionedJid = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const amount = parseInt(args[1]);

        if (!mentionedJid || !amount || isNaN(amount) || amount <= 0) {
            return sock.sendMessage(jid, { text: `❓ Formato incorreto!\n\nUse: \`${PREFIX}pix @membro <valor>\`\n\nExemplo: \`${PREFIX}pix @Fulano 50\`` }, { quoted: m });
        }

        const recipientId = mentionedJid;

        if (recipientId === senderId) {
            return sock.sendMessage(jid, { text: '❌ Você não pode enviar moedas para si mesmo.' }, { quoted: m });
        }

        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (recipientId === botId) {
            return sock.sendMessage(jid, { text: '❤️ Agradeço a gentileza, mas eu não preciso de moedas!' }, { quoted: m });
        }

        // --- 2. Verificação de Saldo ---
        const coinsData = await readCoins();
        const senderCoins = coinsData[senderId] || 0;

        if (senderCoins < amount) {
            return sock.sendMessage(jid, { text: `💰 Saldo insuficiente! Você tem apenas ${senderCoins} moedas e tentou enviar ${amount}.` }, { quoted: m });
        }

        // --- 3. Execução da Transferência ---
        const recipientCoins = coinsData[recipientId] || 0;

        // Subtrai da conta do remetente
        coinsData[senderId] = senderCoins - amount;
        // Adiciona à conta do destinatário
        coinsData[recipientId] = recipientCoins + amount;

        // Salva os novos saldos no arquivo JSON
        await writeCoins(coinsData);

        // --- 4. Mensagem de Confirmação ---
        const confirmationMessage = `
💸 *Transferência PIX Realizada!* 💸

*De:* @${senderId.split('@')[0]}
*Para:* @${recipientId.split('@')[0]}
*Valor:* ${amount} 🪙 moedas

Transação concluída com sucesso!
        `.trim();

        await sock.sendMessage(jid, { text: confirmationMessage, mentions: [senderId, recipientId] });

    } catch (e) {
        console.error("Erro no comando pix:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar a transferência.' }, { quoted: m });
    }
};

module.exports = command;