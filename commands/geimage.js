// commands/geimage.js
const axios = require('axios');
const { PREFIX, HF_TOKEN } = require('../config'); // Pega o token da Hugging Face

const command = async (sock, m, jid, args) => {
    try {
        const prompt = args.join(' ');
        if (!prompt) {
            return sock.sendMessage(jid, { text: `🎨 Use: \`${PREFIX}geimage <descrição da imagem>\`` }, { quoted: m });
        }

        if (!HF_TOKEN || HF_TOKEN.includes('COLE_SEU_TOKEN')) {
            return sock.sendMessage(jid, { text: `❌ A chave da API (Hugging Face) não foi configurada corretamente no arquivo config.js.` }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `🎨 Imaginando "${prompt}" com o modelo Stable Diffusion... Aguarde, por favor.` }, { quoted: m });

        // --- MUDANÇA: Apontando para o modelo mais clássico e estável ---
        const apiUrl = `https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`;
        
        const response = await axios.post(apiUrl, 
            { inputs: prompt }, 
            {
                headers: { "Authorization": `Bearer ${HF_TOKEN}` },
                responseType: 'arraybuffer'
            }
        );

        const imageBuffer = response.data;
        if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('A API retornou uma imagem vazia.');
        }

        await sock.sendMessage(jid, {
            image: imageBuffer,
            caption: `🎨 Arte gerada para:\n_"${prompt}"_`
        }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando geimage:", e.response?.data?.toString() || e.message);
        let errorMessage = '❌ Ocorreu um erro ao gerar a imagem.';
        if (e.response?.status === 503) {
            errorMessage += ' O modelo de IA está sendo carregado pela primeira vez. Por favor, tente o mesmo comando novamente em cerca de 30 segundos.';
        } else {
            errorMessage += ' A API pode estar offline ou sua descrição foi bloqueada.';
        }
        await sock.sendMessage(jid, { text: errorMessage }, { quoted: m });
    }
};

module.exports = command;