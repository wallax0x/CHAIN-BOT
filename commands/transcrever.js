// commands/transcrever.js
const axios = require('axios');
const FormData = require('form-data');
const { API_KEY } = require('../config');
const { getFileBuffer } = require('../utils/getFileBuffer');

module.exports = async (sock, m, jid) => {
    // Variável para guardar a mensagem de status que será editada
    let sentMsg = null;

    try {
        const isQuoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const mediaMessage = isQuoted || m.message;
        
        const audioMessage = mediaMessage.audioMessage || mediaMessage.videoMessage;
        const type = mediaMessage.audioMessage ? 'audio' : mediaMessage.videoMessage ? 'video' : null;

        if (!audioMessage) {
            return sock.sendMessage(jid, { text: '❌ Envie ou marque um áudio/vídeo para transcrever.' }, { quoted: m });
        }
        
        // --- ETAPA 1: REAÇÃO E MENSAGEM INICIAL ---
        await sock.sendMessage(jid, { react: { text: '🔄', key: m.key } });
        sentMsg = await sock.sendMessage(jid, { text: '✍️ _Transcrevendo áudio, aguarde um instante..._' }, { quoted: m });

        // --- ETAPA 2: PROCESSAMENTO E CHAMADA DA API ---
        const buffer = await getFileBuffer(audioMessage, type);

        const form = new FormData();
        form.append('file', buffer, {
            filename: type === 'audio' ? 'audiofile.mp3' : 'videofile.mp4',
            contentType: audioMessage.mimetype
        });

        const response = await axios.post(`https://api.bronxyshost.com.br/transcrever?apikey=${API_KEY}`, form, {
            headers: form.getHeaders()
        });
        
        // --- ETAPA 3: EDITAR A MENSAGEM COM O RESULTADO ---
        if (response.data && response.data.texto) {
            const finalMessage = `📝 *Transcrição:*\n\n${response.data.texto}`;
            
            // Edita a mensagem de "Transcrevendo..." com o resultado final
            await sock.sendMessage(jid, { text: finalMessage, edit: sentMsg.key });
            
            // Muda a reação para indicar sucesso
            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

        } else {
            // Se a API não retornar texto, lança um erro para ser pego pelo catch
            throw new Error('A API não retornou um texto válido.');
        }

    } catch (err) {
        console.error('[transcrever] Erro:', err);
        
        // --- ETAPA DE ERRO ---
        // Muda a reação para indicar falha
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        
        const errorMessage = '❌ Ocorreu um erro ao transcrever. O áudio pode ser muito longo, estar sem som ou a API pode estar offline.';
        
        // Se a mensagem de "Transcrevendo..." foi enviada, edita ela com o erro
        if (sentMsg?.key) {
            await sock.sendMessage(jid, { text: errorMessage, edit: sentMsg.key });
        } else {
            // Caso contrário, envia uma nova mensagem de erro
            await sock.sendMessage(jid, { text: errorMessage }, { quoted: m });
        }
    }
};