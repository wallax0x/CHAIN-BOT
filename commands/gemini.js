// commands/gemini.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

const { GEMINI_API_KEY, GEMINI_MODEL_NAME } = require('../config');

const { getUserHistory, updateUserHistory } = require('../utils/user_state_manager');

// Inicializa a IA do Gemini

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

const command = async (sock, m, jid, args, senderId) => {

    const prompt = args.join(' ');

    if (!prompt) {

        return sock.sendMessage(jid, { text: 'Olá! Por favor, me faça uma pergunta ou me dê um tópico para conversar.' }, { quoted: m });

    }

    try {

        await sock.sendMessage(jid, { react: { text: '🤔', key: m.key } });

        // Pega o histórico de conversa do usuário

        const userHistory = getUserHistory(senderId);

        // Inicia um chat com o modelo, fornecendo o histórico anterior

        const chat = model.startChat({

            history: userHistory,

            generationConfig: {

                maxOutputTokens: 1000,

            },

        });

        // Envia a nova pergunta

        const result = await chat.sendMessage(prompt);

        const responseText = result.response.text();

        

        // Atualiza o histórico com a pergunta atual e a resposta do bot

        const newHistory = await chat.getHistory();

        updateUserHistory(senderId, newHistory);

        

        // Responde ao usuário

        await sock.sendMessage(jid, { text: responseText }, { quoted: m });

    } catch (e) {

        console.error("Erro no comando gemini:", e);

        await sock.sendMessage(jid, { text: '❌ Desculpe, ocorreu um erro ao me comunicar com a IA. Tente novamente.' }, { quoted: m });

    }

};

module.exports = command;