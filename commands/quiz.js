// commands/quiz.js
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY, GEMINI_MODEL_NAME } = require('../config');
const { addXp } = require('../utils/xp_manager');
const { readCoins, writeCoins } = require('../utils/coin_manager');

const QUIZ_DATA_PATH = path.resolve(__dirname, '../json/quiz_games.json');

// --- Configurações do Jogo ---
const XP_REWARD = 50;
const COINS_REWARD = 10;
const QUIZ_TIMEOUT = 60000; // 60 segundos
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Inicialização da IA do Gemini ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

// --- Funções Auxiliares ---
async function readQuizData() { try { const data = await fs.readFile(QUIZ_DATA_PATH, 'utf8'); return data ? JSON.parse(data) : {}; } catch { return {}; } }
async function writeQuizData(data) { await fs.writeFile(QUIZ_DATA_PATH, JSON.stringify(data, null, 2)); }

async function translateText(text) {
    try {
        const prompt = `Traduza o seguinte texto para o português do Brasil, de forma natural e direta. Retorne APENAS o texto traduzido, sem nenhuma introdução ou explicação.\n\nTexto original: "${text}"`;
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("[Gemini Translate] Erro na tradução, retornando texto original:", error.message);
        return text; // Retorna o texto original em caso de falha
    }
}

// --- Lógica para Iniciar o Quiz ---
const startQuiz = async (sock, m, jid) => {
    let sentMsg = null;
    try {
        const quizData = await readQuizData();
        if (quizData[jid]?.isActive) {
            return sock.sendMessage(jid, { text: '⚠️ Um quiz já está em andamento!' }, { quoted: m });
        }

        await sock.sendMessage(jid, { react: { text: '🧠', key: m.key } });
        sentMsg = await sock.sendMessage(jid, { text: 'Buscando e traduzindo uma nova pergunta, aguarde...' }, { quoted: m });

        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple&encode=base64');
        const trivia = response.data.results[0];
        if (!trivia) throw new Error('Falha ao buscar pergunta na API.');

        const originalTexts = [
            Buffer.from(trivia.question, 'base64').toString('utf8'),
            Buffer.from(trivia.correct_answer, 'base64').toString('utf8'),
            ...trivia.incorrect_answers.map(a => Buffer.from(a, 'base64').toString('utf8'))
        ];

        // Traduz um por um com pausa para não exceder o limite da API
        const translatedTexts = [];
        for (const text of originalTexts) {
            const translated = await translateText(text);
            translatedTexts.push(translated);
            await delay(300); // Pausa de 300ms entre cada pedido
        }
        
        const [question, correctAnswer, ...incorrectAnswers] = translatedTexts;
        
        const options = [...incorrectAnswers, correctAnswer].sort(() => Math.random() - 0.5);
        const correctAnswerLetter = String.fromCharCode(65 + options.indexOf(correctAnswer));

        let quizMessage = `*🧠 QUIZ DE CONHECIMENTOS GERAIS 🧠*\n\n*Pergunta:* ${question}\n\n*Opções:*\n`;
        options.forEach((option, index) => {
            quizMessage += `  *${String.fromCharCode(65 + index)}.* ${option}\n`;
        });
        quizMessage += `\nVocê tem ${QUIZ_TIMEOUT / 1000} segundos para responder!`;

        quizData[jid] = { isActive: true, correctAnswer: correctAnswerLetter, wrongGuessers: [] };
        await writeQuizData(quizData);
        await sock.sendMessage(jid, { text: quizMessage, edit: sentMsg.key });

        setTimeout(async () => {
            const currentQuizData = await readQuizData();
            if (currentQuizData[jid]) { // Se o jogo ainda existir (ninguém acertou)
                await sock.sendMessage(jid, { text: `⏰ O tempo para o quiz acabou! A resposta correta era *${currentQuizData[jid].correctAnswer}*.` });
                delete currentQuizData[jid];
                await writeQuizData(currentQuizData);
            }
        }, QUIZ_TIMEOUT);

    } catch (e) {
        console.error("Erro ao iniciar o quiz:", e);
        const errorMsg = '❌ Ocorreu um erro ao buscar ou traduzir a pergunta.';
        if (sentMsg?.key) {
            await sock.sendMessage(jid, { text: errorMsg, edit: sentMsg.key });
        } else {
            await sock.sendMessage(jid, { text: errorMsg }, { quoted: m });
        }
    }
};

// --- Lógica para Verificar a Resposta ---
const checkAnswer = async (sock, m, jid, senderId, messageText) => {
    try {
        const quizData = await readQuizData();
        const game = quizData[jid];

        if (!game?.isActive) return;
        
        const answer = messageText.trim().toUpperCase();
        if (!['A', 'B', 'C', 'D'].includes(answer)) return;

        if (game.wrongGuessers.includes(senderId)) {
            return await sock.sendMessage(jid, { react: { text: '🤫', key: m.key } });
        }

        if (answer === game.correctAnswer) {
            await addXp(senderId, jid, XP_REWARD);
            const coins = await readCoins();
            coins[senderId] = (coins[senderId] || 0) + COINS_REWARD;
            await writeCoins(coins);
            const successMessage = `🎉 Parabéns, @${senderId.split('@')[0]}! A resposta *${game.correctAnswer}* estava correta! Você ganhou *${XP_REWARD} XP* e *${COINS_REWARD} moedas*!`;
            await sock.sendMessage(jid, { text: successMessage, mentions: [senderId] });
            
            delete quizData[jid];
            await writeQuizData(quizData);
        
        } else {
            game.wrongGuessers.push(senderId);
            await writeQuizData(quizData);
            const wrongAnswerMessage = `❌ Incorreto, @${senderId.split('@')[0]}! Você não pode mais responder nesta rodada.`;
            await sock.sendMessage(jid, { text: wrongAnswerMessage, mentions: [senderId] }, { quoted: m });
        }
    } catch (e) {
        console.error("Erro ao verificar resposta do quiz:", e);
    }
};

module.exports = { startQuiz, checkAnswer };