// commands/falar.js
const axios = require('axios');
const { PREFIX } = require('../config');

const MAX_TEXT_LENGTH = 250; // Limite de 250 caracteres para não sobrecarregar

const command = async (sock, m, jid, args) => {
    const text = args.join(' ');

    if (!text) {
        const helpMsg = `🗣️ O que você quer que eu fale?\n\n*Exemplo:* \`${PREFIX}falar Olá, eu sou um robô.\``;
        return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
    }

    if (text.length > MAX_TEXT_LENGTH) {
        return sock.sendMessage(jid, { text: `❌ O texto é muito longo! O limite é de ${MAX_TEXT_LENGTH} caracteres.` }, { quoted: m });
    }

    try {
        await sock.sendMessage(jid, { react: { text: '🗣️', key: m.key } });

        // Constrói a URL da API não-oficial do Google Translate TTS
        const encodedText = encodeURIComponent(text);
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=pt-BR&client=tw-ob`;
        
        // Faz a requisição para obter o áudio como um buffer
        const response = await axios.get(ttsUrl, {
            responseType: 'arraybuffer'
        });

        const audioBuffer = Buffer.from(response.data, 'binary');

        // Envia o áudio como uma nota de voz (PTT)
        await sock.sendMessage(jid, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            ptt: true // Isso faz com que seja enviado como nota de voz
        }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando falar (TTS):", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao gerar o áudio. Tente novamente.' }, { quoted: m });
    }
};

module.exports = command;