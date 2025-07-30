// commands/loja.js
const ITENS_DA_LOJA = require('../utils/loja_itens');
const { PREFIX } = require('../config');

module.exports = async (sock, m, jid) => {
    try {
        await sock.sendMessage(jid, { react: { text: '🛍️', key: m.key } });

        let shopMessage = '╭───⌈ 🛍️ *LOJA DE ITENS* ⌋\n';
        shopMessage += '│\n';
        shopMessage += `│ Use \`${PREFIX}comprar <id_item>\` para adquirir.\n`;
        shopMessage += '│\n';

        if (ITENS_DA_LOJA.length === 0) {
            shopMessage += '│ 텅텅... A loja está vazia no momento.\n';
        } else {
            // Categoria única para todos os itens
            shopMessage += '├─ ⋅ ❉ *Itens Disponíveis* ❉ ⋅ ─\n';

            // Loop único que mostra todos os itens, sem filtrar por tipo
            ITENS_DA_LOJA.forEach(item => {
                shopMessage += `│\n`;
                shopMessage += `│  *${item.emoji} ${item.nome}* (\`${item.id}\`)\n`;
                shopMessage += `│  ├─ Preço: ${item.preco} 💰\n`;
                shopMessage += `│  ╰─ Desc.: _${item.descricao}_\n`;
            });
        }

        shopMessage += '│\n╰───────────────';

        await sock.sendMessage(jid, { text: shopMessage }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando loja:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao exibir a loja.' }, { quoted: m });
    }
};