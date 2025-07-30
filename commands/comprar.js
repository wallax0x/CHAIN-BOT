// commands/comprar.js (VERSÃO COMPLETA COM VERIFICAÇÃO DE PRISÃO)

const fs = require('fs').promises;
const path = require('path');
const ITENS_DA_LOJA = require('../utils/loja_itens');
const { readCoins, writeCoins } = require('../utils/coin_manager');
const { setUserTitle } = require('../utils/xp_manager');
const { PREFIX } = require('../config');
// ✅ Importa a função para verificar se o usuário está preso
const { checkIfJailed } = require('./pagarfianca.js'); 

// Caminho para o arquivo de inventário
const INVENTORY_PATH = path.resolve(__dirname, '../json/inventario.json');

// Funções auxiliares para ler e escrever no inventário
const readInventory = async () => { try { const data = await fs.readFile(INVENTORY_PATH, 'utf8'); return data ? JSON.parse(data) : {}; } catch { return {}; } };
const writeInventory = async (data) => { await fs.writeFile(INVENTORY_PATH, JSON.stringify(data, null, 2)); };

module.exports = async (sock, m, jid, args) => {
    try {
        const senderId = m.key.participant || m.key.remoteJid;

        // ✅ VERIFICAÇÃO DE PRISÃO
        // Impede que o usuário compre qualquer coisa se estiver na prisão
        const jailStatus = await checkIfJailed(senderId);
        if (jailStatus) {
            return sock.sendMessage(jid, { 
                text: `🚨 Você está na prisão e não pode fazer compras! Use \`${PREFIX}pagarfianca\` para pagar sua fiança de ${jailStatus.bailAmount} moedas.` 
            }, { quoted: m });
        }
        
        const itemId = args[0]?.toLowerCase();

        if (!itemId) {
            return sock.sendMessage(jid, { text: `❓ Você precisa especificar o ID do item. Use \`${PREFIX}loja\` para ver as opções.` }, { quoted: m });
        }

        const item = ITENS_DA_LOJA.find(i => i.id === itemId);

        if (!item) {
            return sock.sendMessage(jid, { text: `❌ Item com ID \`${itemId}\` não encontrado na loja.` }, { quoted: m });
        }

        const coinsData = await readCoins();
        const userCoins = coinsData[senderId] || 0;

        if (userCoins < item.preco) {
            return sock.sendMessage(jid, { text: `💰 Moedas insuficientes! Você precisa de ${item.preco} moedas, mas tem apenas ${userCoins}.` }, { quoted: m });
        }

        // --- LÓGICA DE COMPRA ---

        // Deduz as moedas do usuário
        coinsData[senderId] = userCoins - item.preco;
        await writeCoins(coinsData);
        await sock.sendMessage(jid, { react: { text: '🛒', key: m.key } });

        // Executa a ação específica para o item comprado
        if (item.id === 'titulo') {
            const title = args.slice(1).join(' ').trim();
            if (!title) {
                return sock.sendMessage(jid, { text: `❌ Você precisa definir o texto do seu título.\n\n*Exemplo:* \`${PREFIX}comprar titulo Rei do Grupo\`` }, { quoted: m });
            }
            if (title.length > 20) {
                return sock.sendMessage(jid, { text: '❌ O título deve ter no máximo 20 caracteres.' }, { quoted: m });
            }
            if (['bot', 'dono', 'admin'].some(term => title.toLowerCase().includes(term))) {
                return sock.sendMessage(jid, { text: '❌ Títulos como "bot", "dono" ou "admin" não são permitidos.' }, { quoted: m });
            }
            await setUserTitle(senderId, title);
            await sock.sendMessage(jid, { text: `🎉 Você comprou *${item.nome}* e seu novo título "${title}" foi definido com sucesso!\n\n*Saldo restante:* ${coinsData[senderId]} moedas 💰` }, { quoted: m });
        
        } else if (item.id === 'caixa') {
            const inventory = await readInventory();
            const userInventory = inventory[senderId] || { caixas: 0 };
            userInventory.caixas++;
            
            inventory[senderId] = userInventory;
            await writeInventory(inventory);

            await sock.sendMessage(jid, { text: `🎉 Você comprou uma *${item.nome}*!\n\nUse o comando \`${PREFIX}abrir\` para ver o que tem dentro!\n\n*Saldo restante:* ${coinsData[senderId]} moedas 💰` }, { quoted: m });

        } else {
            // Lógica para outros itens no futuro
            await sock.sendMessage(jid, { text: `🎉 Você comprou *${item.nome}*!\n\n*Saldo restante:* ${coinsData[senderId]} moedas 💰` }, { quoted: m });
        }

    } catch (e) {
        console.error('Erro no comando comprar:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar sua compra.' }, { quoted: m });
    }
};