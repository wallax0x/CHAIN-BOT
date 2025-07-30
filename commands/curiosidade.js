// commands/curiosidade.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY, GEMINI_MODEL_NAME } = require('../config');

// --- Inicialização da IA do Gemini ---
// Garante que a inicialização só ocorre se a chave existir
let model;
if (GEMINI_API_KEY) {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME || 'gemini-pro' });
    } catch (e) {
        console.error("[Curiosidade] Erro ao inicializar o modelo Gemini. Verifique sua chave de API e nome do modelo.", e);
    }
} else {
    console.warn("[Curiosidade] Chave de API do Gemini não encontrada no config.js. O comando .curiosidade não funcionará.");
}

// --- Lógica Principal do Comando ---
const command = async (sock, m, jid, args) => {
    // Verifica se a IA foi inicializada corretamente
    if (!model) {
        return sock.sendMessage(jid, { text: '❌ A função de curiosidades não está configurada no momento (sem chave de API).' }, { quoted: m });
    }

    try {
        await sock.sendMessage(jid, { react: { text: '🧠', key: m.key } });

        const topic = args.join(' ').trim();
        let prompt;

        // Cria um prompt diferente se o usuário especificou um tema ou não
        if (topic) {
            prompt = `Me diga um fato ou uma curiosidade interessante e surpreendente sobre "${topic}". Seja direto e explique de forma clara e concisa em português.`;
            console.log(`[Curiosidade] Buscando fato sobre: ${topic}`);
        } else {
            prompt = "Me diga um fato ou uma curiosidade aleatória, interessante e surpreendente sobre qualquer assunto (ciência, história, animais, tecnologia, etc). Seja direto e explique de forma clara e concisa em português.";
            console.log(`[Curiosidade] Buscando fato aleatório.`);
        }

        // Chama a API do Gemini
        const result = await model.generateContent(prompt);
        const fact = result.response.text();

        // Formata a resposta de forma bonita
        const responseMessage = `
🧠 *Você Sabia?* 🧠
-----------------------------------

${fact}
        `.trim();

        await sock.sendMessage(jid, { text: responseMessage }, { quoted: m });
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Erro no comando curiosidade:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao buscar uma curiosidade. A IA pode estar sobrecarregada ou a chave de API é inválida.' }, { quoted: m });
    }
};

module.exports = command;