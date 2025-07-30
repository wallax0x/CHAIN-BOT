// commands/stickersearch.js
const axios = require('axios');
const { API_KEY, PREFIX } = require('../config');
const { exec } = require('child_process');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const TEMP_FOLDER = path.resolve(__dirname, '..', 'temp');

async function createSticker(imagePath) {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(TEMP_FOLDER, `sticker_${Date.now()}.webp`);
        const command = `ffmpeg -i ${imagePath} -y -vcodec libwebp -filter:v fps=fps=20 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 ${outputPath}`;
        
        exec(command, async (error) => {
            if (error) {
                console.error('Erro ao converter para sticker:', error);
                return reject(new Error('Falha na conversão da imagem.'));
            }
            const sticker = await fsp.readFile(outputPath);
            await fsp.unlink(outputPath).catch(err => {});
            resolve(sticker);
        });
    });
}

const command = async (sock, m, jid, args) => {
    const query = args.join(' ');
    if (!query) {
        return sock.sendMessage(jid, { text: `🖼️ O que você quer que eu procure?\n\n*Exemplo:* \`${PREFIX}stickersearch cachorro de óculos\`` }, { quoted: m });
    }

    let imagePath = '';
    let sentMsg = null;

    try {
        await sock.sendMessage(jid, { react: { text: '🔍', key: m.key } });
        sentMsg = await sock.sendMessage(jid, { text: `*Buscando imagens para:* _"${query}"_` }, { quoted: m });
        
        const apiUrl = `https://api.bronxyshost.com.br/api-bronxys/google-img?nome=${encodeURIComponent(query)}&apikey=${API_KEY}`;
        
        // --- NOVO: Lógica para tratar a lista de URLs da API ---

        // 1. Busca a LISTA de imagens da API
        const response = await axios.get(apiUrl, { responseType: 'json' });
        const imageList = response.data;

        if (!Array.isArray(imageList) || imageList.length === 0) {
            throw new Error('A API não retornou uma lista de imagens.');
        }

        // 2. Escolhe uma imagem aleatória da lista
        const randomIndex = Math.floor(Math.random() * imageList.length);
        const chosenImageUrl = imageList[randomIndex].url;

        if (!chosenImageUrl) {
            throw new Error('A imagem escolhida da lista não tem uma URL válida.');
        }
        
        console.log(`[StickerSearch] Imagem escolhida da API: ${chosenImageUrl}`);
        
        // --- FIM DA NOVA LÓGICA ---

        await sock.sendMessage(jid, { text: `✅ Imagem encontrada!\n\n🧙‍♂️ _Criando sua figurinha..._`, edit: sentMsg.key });

        // 3. Baixa a imagem da URL escolhida
        const imageResponse = await axios.get(chosenImageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');

        await fsp.mkdir(TEMP_FOLDER, { recursive: true });
        imagePath = path.join(TEMP_FOLDER, `search_${Date.now()}.jpg`);
        await fsp.writeFile(imagePath, imageBuffer);

        const stickerBuffer = await createSticker(imagePath);
        
        await sock.sendMessage(jid, { sticker: stickerBuffer });
        await sock.sendMessage(jid, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Erro no comando stickersearch:", e);
        await sock.sendMessage(jid, { react: { text: '❌', key: m.key } });
        const errorMessage = `❌ Desculpe, não consegui criar uma figurinha para *"${query}"*.\n\n_A API pode não ter encontrado resultados. Tente outros termos._`;
        if (sentMsg?.key) {
            await sock.sendMessage(jid, { text: errorMessage, edit: sentMsg.key });
        } else {
            await sock.sendMessage(jid, { text: errorMessage }, { quoted: m });
        }
    } finally {
        if (imagePath && fs.existsSync(imagePath)) {
            await fsp.unlink(imagePath).catch(err => {});
        }
    }
};

module.exports = command;