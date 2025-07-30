// commands/simih.js

// Importa a função de obter resposta do nosso gerenciador
const { getResponse } = require('../utils/simi_manager');
const { PREFIX } = require('../config');

const command = async (sock, m, jid, args) => {
    try {
        const trigger = args.join(' ');

        if (!trigger) {
            return sock.sendMessage(jid, { text: `🧠 O que você quer que eu responda?\n\nUse: \`${PREFIX}simih <frase>\`` }, { quoted: m });
        }

        // Reage para mostrar que está processando
        await sock.sendMessage(jid, { react: { text: '🤔', key: m.key } });

        // Busca por uma resposta no banco de dados
        const learnedResponse = await getResponse(trigger);
        
        // Pequeno delay para a resposta não chegar junto com a reação
        await new Promise(resolve => setTimeout(resolve, 800)); 

        if (learnedResponse) {
            // Se encontrou uma resposta, envia
            await sock.sendMessage(jid, { text: learnedResponse }, { quoted: m });
        } else {
            // Se não encontrou, avisa ao usuário
            await sock.sendMessage(jid, { text: `Não sei o que responder para "${trigger}". Me ensine respondendo a essa frasel! ` }, { quoted: m });
        }

    } catch (e) {
        console.error("Erro no comando simih:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao buscar no meu banco de dados.' }, { quoted: m });
    }
};

module.exports = command;