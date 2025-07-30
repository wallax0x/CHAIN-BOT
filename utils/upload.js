const https = require('https');
const { URL } = require('url');

/**
 * Faz upload de um buffer de imagem para catbox.moe usando o módulo HTTPS nativo.
 * @param {Buffer} buffer O buffer da imagem a ser enviada.
 * @param {string} mimeType O tipo MIME da imagem (ex: 'image/jpeg', 'image/png').
 * @param {string} filename O nome do arquivo (ex: 'image.jpg').
 * @returns {Promise<string>} A URL da imagem hospedada.
 */
async function uploadToCatbox(buffer, mimeType, filename = 'file') {
    return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2, 15); // Limite mais curto
        const fileExtension = mimeType.split('/')[1] || 'bin'; // Ex: 'jpeg', 'png'

        // Monta a parte do corpo para o arquivo
        let filePart = `--${boundary}\r\n`;
        filePart += `Content-Disposition: form-data; name="fileToUpload"; filename="${filename}.${fileExtension}"\r\n`;
        filePart += `Content-Type: ${mimeType}\r\n`;
        filePart += '\r\n';
        // (Buffer da imagem vai aqui)
        
        // Monta a parte do corpo para o reqtype
        let reqtypePart = `--${boundary}\r\n`;
        reqtypePart += `Content-Disposition: form-data; name="reqtype"\r\n`;
        reqtypePart += '\r\n';
        reqtypePart += `fileupload\r\n`;

        let endBoundary = `--${boundary}--\r\n`;

        // Concatena as partes em um único Buffer
        const bodyBuffer = Buffer.concat([
            Buffer.from(reqtypePart),
            Buffer.from(filePart),
            buffer, // O buffer da imagem
            Buffer.from(`\r\n${endBoundary}`) // Quebra de linha e final
        ]);

        const options = {
            hostname: 'catbox.moe',
            path: '/user/api.php',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': bodyBuffer.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                const url = responseData.trim();
                if (url.startsWith('http')) { // Catbox retorna a URL direta em caso de sucesso
                    resolve(url);
                } else {
                    reject(new Error(`Catbox.moe retornou erro: ${url || 'Resposta vazia'}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(new Error('Erro na requisição HTTPS para Catbox.moe: ' + e.message));
        });

        req.write(bodyBuffer); // Escreve o corpo completo de uma vez
        req.end();
    });
}

module.exports = {
    uploadToTelegraph: uploadToCatbox // Renomeia a exportação para usar a função de Catbox
};