const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const TEMP_FOLDER = path.resolve(__dirname, '..', 'temp_thanos');

// Cria a pasta se não existir
if (!fs.existsSync(TEMP_FOLDER)) {
    fs.mkdirSync(TEMP_FOLDER);
}

const command = async (sock, m, jid, args) => {
    try {
        await sock.sendMessage(jid, { react: { text: '🫰', key: m.key } });

        // Identifica o alvo
        let target = m.key.participant || m.participant || m.key.remoteJid;
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message.extendedTextMessage?.contextInfo?.participant) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        }

        const pfpUrl = await sock.profilePictureUrl(target, 'image');
        const image = await Canvas.loadImage(pfpUrl);
        const width = image.width;
        const height = image.height;

        const canvas = Canvas.createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const totalFrames = 10;

        for (let f = 0; f < totalFrames; f++) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (Math.random() < (f + 1) / totalFrames) {
                    data[i + 3] = 0; // Transparente
                }
            }

            ctx.putImageData(imageData, 0, 0);

            const framePath = path.join(TEMP_FOLDER, `frame_${f.toString().padStart(2, '0')}.png`);
            fs.writeFileSync(framePath, canvas.toBuffer('image/png'));
        }

        const outputPath = path.join(TEMP_FOLDER, 'thanos.mp4');

        await new Promise((resolve, reject) => {
            exec(`ffmpeg -y -framerate 6 -i ${TEMP_FOLDER}/frame_%02d.png -vf "format=yuv420p" -pix_fmt yuv420p ${outputPath}`, (err, stdout, stderr) => {
                if (err) return reject(err);
                resolve();
            });
        });

        const buffer = fs.readFileSync(outputPath);

        await sock.sendMessage(jid, {
            video: buffer,
            gifPlayback: true,
            caption: 'A realidade tende a ser decepcionante.'
        }, { quoted: m });

        // Limpeza opcional
        fs.readdirSync(TEMP_FOLDER).forEach(file => fs.unlinkSync(path.join(TEMP_FOLDER, file)));

    } catch (e) {
        console.error("Erro no comando thanos:", e);
        await sock.sendMessage(jid, {
            text: '❌ Ocorreu um erro ao usar o estalar de dedos. Verifique se o ffmpeg está instalado.'
        }, { quoted: m });
    }
};

module.exports = command;
