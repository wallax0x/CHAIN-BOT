// utils/telegraph.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const TEMP_FOLDER = path.resolve(__dirname, '..', 'temp');

async function upload(buffer) {
    // A API do telegra.ph espera um arquivo, então salvamos o buffer temporariamente
    await fs.promises.mkdir(TEMP_FOLDER, { recursive: true });
    const tempFilePath = path.join(TEMP_FOLDER, `upload_${Date.now()}.png`);
    await fs.promises.writeFile(tempFilePath, buffer);

    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(tempFilePath));

        const { data } = await axios.post('https://telegra.ph/upload', form, {
            headers: form.getHeaders(),
        });

        if (data.error) throw new Error(data.error);
        
        // Retorna o link público da imagem
        return 'https://telegra.ph' + data[0].src;

    } catch (e) {
        throw e;
    } finally {
        // Limpa o arquivo temporário
        if (fs.existsSync(tempFilePath)) await fs.promises.unlink(tempFilePath);
    }
}

module.exports = { upload };