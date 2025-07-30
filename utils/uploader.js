// utils/uploader.js
const axios = require('axios');
const FormData = require('form-data');

// Esta função usa o serviço 'uguu.se' que é uma boa alternativa
async function upload(buffer) {
    try {
        const form = new FormData();
        form.append('files[]', buffer, {
            filename: 'image.png',
            contentType: 'image/png'
        });

        const { data } = await axios.post('https://uguu.se/upload.php', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        // A resposta deste serviço é diferente, então precisamos pegar a URL correta
        if (!data.files || !data.files[0] || !data.files[0].url) {
            throw new Error("A API de upload não retornou uma URL válida.");
        }

        return data.files[0].url;

    } catch (e) {
        console.error("Erro no novo uploader:", e.response?.data || e.message);
        throw new Error("Falha ao fazer upload da imagem com o novo serviço.");
    }
}

module.exports = { upload };