const axios = require('axios');
const sharp = require('sharp');
const { PREFIX } = require('../config');

const getEmojis = (text) => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    return text.match(emojiRegex) || [];
};

const command = async (sock, m, jid, args) => {
    const text = args.join(' ');
    const emojis = getEmojis(text);

    if (emojis.length < 2) {
        const helpMsg = `🧑‍🍳 *EmojiMix Kitchen*\n\nEnvie dois emojis para misturar.\n\nExemplo:\n\`${PREFIX}emojimix 😂+❤️\``;
        return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
    }

    let [e1, e2] = emojis;

    if (e1.codePointAt(0) > e2.codePointAt(0)) [e1, e2] = [e2, e1];

    try {
        await sock.sendMessage(jid, { react: { text: '🧑‍🍳', key: m.key } });

        const code1 = e1.codePointAt(0).toString(16);
        const code2 = e2.codePointAt(0).toString(16);
        const apiUrl = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${code1}/u${code1}_u${code2}.png`;

        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        const pngBuffer = Buffer.from(response.data, 'binary');

        // Converter PNG para WebP
        const webpBuffer = await sharp(pngBuffer)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 100 })
            .toBuffer();

        await sock.sendMessage(jid, {
            sticker: webpBuffer
        }, { quoted: m });

    } catch (e) {
        if (e.response?.status === 404) {
            await sock.sendMessage(jid, { text: `❌ Emojis ${emojis[0]} e ${emojis[1]} não possuem uma mistura.` }, { quoted: m });
        } else {
            console.error("Erro em emojimix:", e.message);
            await sock.sendMessage(jid, { text: '❌ Erro ao gerar a figurinha.' }, { quoted: m });
        }
    }
};

module.exports = command;
