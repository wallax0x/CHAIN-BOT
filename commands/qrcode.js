const https = require('https'); // Módulo HTTPS nativo
const { URL } = require('url'); // Módulo URL nativo

module.exports = async (sock, m, jid, args, PREFIX) => {
    try {
        const textToEncode = args.join(' ').trim();

        if (!textToEncode) {
            return sock.sendMessage(jid, { text: `❌ Por favor, forneça o texto ou link para gerar o QR Code. Ex: *${PREFIX}qrcode Olá Mundo!*` }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: '🔄 Gerando QR Code, aguarde...' }, { quoted: m });

        // API gratuita para gerar QR Code
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(textToEncode)}`;

        let qrcodeBuffer = null;

        // Baixa a imagem do QR Code da API usando HTTPS nativo
        qrcodeBuffer = await new Promise((resolve, reject) => {
            const urlParsed = new URL(apiUrl);
            https.get(urlParsed, (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(Buffer.concat(chunks));
                    } else {
                        reject(new Error(`Falha ao baixar QR Code: Status ${res.statusCode}`));
                    }
                });
            }).on('error', reject);
        });

        // Envia a imagem do QR Code
        await sock.sendMessage(jid, { image: qrcodeBuffer, mimetype: 'image/png' }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando qrcode:', e);
        let errorMessage = '❌ Ocorreu um erro ao gerar o QR Code. Tente novamente mais tarde.';
        if (e.message.includes('too large') || e.message.includes('Falha ao baixar')) { // Erro de texto longo ou download
            errorMessage = '❌ O texto é muito longo para gerar um QR Code ou houve um problema de conexão. Tente algo mais curto.';
        }
        return sock.sendMessage(jid, { text: errorMessage }, { quoted: m });
    }
};