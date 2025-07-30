const { GEMINI_API_KEY, GEMINI_MODEL_NAME } = require('../config.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { YoutubeTranscript } = require('youtube-transcript');
const ytdl = require('ytdl-core');

// --- Inicialização da API do Gemini ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

/**
 * NOVA FUNÇÃO: Tenta buscar a transcrição em uma lista de idiomas.
 * @param {string} videoUrl - O link do vídeo.
 * @returns {Promise<string|null>} O texto da transcrição ou null se não encontrar.
 */
async function fetchTranscriptWithFallbacks(videoUrl) {
    const languages = ['pt', 'en', 'es']; // Lista de idiomas para tentar, em ordem de prioridade

    for (const lang of languages) {
        try {
            console.log(`[Resumir] Tentando buscar legenda em: '${lang}'`);
            const transcriptArray = await YoutubeTranscript.fetchTranscript(videoUrl, { lang });
            if (transcriptArray && transcriptArray.length > 0) {
                console.log(`[Resumir] Sucesso! Legenda encontrada em '${lang}'.`);
                return transcriptArray.map(line => line.text).join(' ');
            }
        } catch (error) {
            console.log(`[Resumir] Falha ao buscar em '${lang}': ${error.message}`);
            // Continua para o próximo idioma do loop
        }
    }
    // Se o loop terminar sem sucesso, retorna null
    return null;
}


/**
 * Função principal do comando .resumir
 */
module.exports = {
    command: async (sock, m, jid, args) => {
        try {
            const videoUrl = args[0];

            if (!videoUrl || !ytdl.validateURL(videoUrl)) {
                await sock.sendMessage(jid, { react: { text: '❓', key: m.key } });
                return sock.sendMessage(jid, { text: '❌ Por favor, forneça um link válido do YouTube.' }, { quoted: m });
            }

            await sock.sendMessage(jid, { react: { text: '📄', key: m.key } });
            await sock.sendMessage(jid, { text: 'Analisando legendas do vídeo... Isso é rápido!' }, { quoted: m });

            // 2. Usa a nova função para buscar a transcrição
            const transcript = await fetchTranscriptWithFallbacks(videoUrl);

            if (!transcript) {
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
                return sock.sendMessage(jid, { text: 'Desculpe, não consegui encontrar nenhuma legenda disponível para este vídeo (nem em português, nem em inglês).' }, { quoted: m });
            }
            console.log(`[Resumir] Transcrição obtida com sucesso. Tamanho: ${transcript.length} caracteres.`);

            // O resto do comando continua igual...
            await sock.sendMessage(jid, { react: { text: '🧠', key: m.key } });
            await sock.sendMessage(jid, { text: 'Legendas encontradas! Enviando para a IA gerar o resumo...' }, { quoted: m });

            const prompt = `Você é um especialista em análise de conteúdo. Sua tarefa é criar um resumo claro e informativo do seguinte vídeo do YouTube, com base na transcrição do áudio. Organize sua resposta da seguinte forma:\n\n1.  **Resumo Geral:** Um parágrafo conciso que captura a ideia principal do vídeo.\n2.  **Pontos Principais:** Uma lista (usando marcadores •) com os 3 a 5 argumentos ou tópicos mais importantes discutidos no vídeo.\n3.  **Conclusão:** Um resumo da conclusão do vídeo ou da mensagem final do autor.\n\n**Transcrição do Vídeo:**\n\n"${transcript}"`;
            
            const result = await model.generateContent(prompt);
            const summary = await result.response.text();

            const videoInfo = await ytdl.getInfo(videoUrl);
            const videoTitle = videoInfo.videoDetails.title;
            const finalResponse = `*📄 Resumo do Vídeo: ${videoTitle}*\n\n${summary}`;
            await sock.sendMessage(jid, { text: finalResponse }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

        } catch (error) {
            console.error("Erro no comando .resumir:", error);
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
            await sock.sendMessage(jid, { text: 'Ocorreu um erro inesperado ao tentar resumir o vídeo.' }, { quoted: m });
        }
    }
};