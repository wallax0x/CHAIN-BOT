// commands/desenhar.js

const axios = require('axios'); // Usaremos axios para esta API

const command = async (sock, m, jid, args, PREFIX) => {
    const prompt = args.join(' ');

    if (!prompt) {
        return sock.sendMessage(jid, { text: `🎨 Você precisa me dizer o que desenhar.\n\nExemplo: \`${PREFIX}desenhar um gato astronauta, 4k, ultra realista\`` }, { quoted: m });
    }

    try {
        await sock.sendMessage(jid, { text: `🎨 Gerando sua arte para: "${prompt}"...\n\nPor favor, aguarde, isso pode levar até um minuto.` }, { quoted: m });

        // --- MUDANÇA: Usando uma API pública e gratuita para gerar imagens ---
        const apiUrl = `https://api.prodia.com/v1/sdxl/generate`;

        const response = await axios.post(apiUrl, {
            prompt: prompt,
            model: 'sd_xl_base_1.0.safetensors [be9edd61]', // Um modelo popular de Stable Diffusion XL
            sampler: 'DPM++ 2M Karras',
            cfg_scale: 7,
            steps: 25,
        }, {
            headers: {
                'X-Prodia-Key': '00000000-0000-0000-0000-000000000000' // Esta API pública aceita uma chave genérica
            }
        });

        const jobId = response.data.job;
        if (!jobId) {
            throw new Error('Não foi possível iniciar a geração da imagem.');
        }

        // A API de imagem funciona em duas etapas: primeiro você pede, depois busca o resultado.
        // Vamos esperar alguns segundos e tentar buscar a imagem.
        let imageUrl = '';
        let attempts = 0;
        const maxAttempts = 15;

        while (attempts < maxAttempts) {
            // Espera 3 segundos entre cada tentativa
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const jobResponse = await axios.get(`https://api.prodia.com/v1/job/${jobId}`);
            
            if (jobResponse.data.status === 'succeeded') {
                imageUrl = jobResponse.data.imageUrl;
                break; // Sai do loop se a imagem estiver pronta
            } else if (jobResponse.data.status === 'failed') {
                throw new Error('A geração da imagem falhou na API.');
            }
            
            attempts++;
        }

        if (!imageUrl) {
            return sock.sendMessage(jid, { text: '❌ A geração da imagem demorou muito para responder. Tente novamente.' }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            image: { url: imageUrl },
            caption: `🎨 Arte gerada para:\n_"${prompt}"_`
        }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando desenhar:", e.response?.data || e.message);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao gerar a imagem. A API pode estar sobrecarregada.' }, { quoted: m });
    }
};

module.exports = command;