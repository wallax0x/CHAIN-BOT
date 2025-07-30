// commands/perfilcard.js
const Canvas = require('canvas');
const path = require('path');
const { getUserXp, getXpNeededForLevel } = require('../utils/xp_manager');
const { readCoins } = require('../utils/coin_manager');

// Função para deixar a foto de perfil redonda
function applyCircularMask(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
}

const command = async (sock, m, jid, args, senderId) => {
    try {
        await sock.sendMessage(jid, { react: { text: '🖼️', key: m.key } });

        // --- 1. Coleta de Dados do Usuário ---
        const userXpData = await getUserXp(senderId);
        const coinsData = await readCoins();
        const userCoins = coinsData[senderId] || 0;
        
        const currentLevel = userXpData.level;
        const currentXp = userXpData.xp;
        const xpForCurrentLevel = getXpNeededForLevel(currentLevel);
        const xpForNextLevel = getXpNeededForLevel(currentLevel + 1);
        const xpInLevel = currentXp - xpForCurrentLevel;
        const xpToLevelUp = xpForNextLevel - xpForCurrentLevel;
        const xpProgress = Math.max(0, Math.min(100, (xpInLevel / xpToLevelUp) * 100));

        // --- 2. Preparação do Canvas ---
        const canvas = Canvas.createCanvas(900, 300);
        const ctx = canvas.getContext('2d');

        // Carrega a imagem de fundo
        const background = await Canvas.loadImage(path.resolve(__dirname, '..', 'assets', 'background_card.png'));
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // --- 3. Desenha a Foto de Perfil ---
        const avatarSize = 200;
        const avatarX = 50;
        const avatarY = (canvas.height - avatarSize) / 2;
        
        ctx.save();
        applyCircularMask(ctx, avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2);
        
        let avatar;
        try {
            const avatarUrl = await sock.profilePictureUrl(senderId, 'image');
            avatar = await Canvas.loadImage(avatarUrl);
        } catch (e) {
            // Se o usuário não tiver foto, usa uma imagem padrão
            avatar = await Canvas.loadImage(path.resolve(__dirname, '..', 'assets', 'default_avatar.png')); // Crie essa imagem!
        }
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // --- 4. Desenha os Textos ---
        const textX = avatarX + avatarSize + 30;

        // Nome do Usuário
        ctx.fillStyle = '#FFFFFF'; // Cor branca
        ctx.font = 'bold 45px Sans';
        ctx.fillText(m.pushName || 'Viajante', textX, 80);

        // Título do Usuário
        if (userXpData.title) {
            ctx.fillStyle = '#CCCCCC'; // Cinza claro
            ctx.font = 'italic 30px Sans';
            ctx.fillText(userXpData.title, textX, 120);
        }

        // Level e Moedas
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '35px Sans';
        ctx.fillText(`Nível ${currentLevel} | ${userCoins} Moedas 💰`, textX, 180);

        // --- 5. Desenha a Barra de Progresso de XP ---
        const barX = textX;
        const barY = 220;
        const barWidth = 580;
        const barHeight = 40;

        // Fundo da barra
        ctx.fillStyle = '#444444';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Preenchimento da barra
        ctx.fillStyle = '#00A8FF'; // Azul
        ctx.fillRect(barX, barY, (barWidth * xpProgress) / 100, barHeight);
        
        // Texto do XP sobre a barra
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 25px Sans';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentXp} / ${xpForNextLevel} XP`, canvas.width / 2 + 120, barY + 28);

        // --- 6. Envia a Imagem Final ---
        const buffer = canvas.toBuffer('image/png');
        await sock.sendMessage(jid, { image: buffer, caption: `*Aqui está seu card de perfil, ${m.pushName}!*` });

    } catch (e) {
        console.error("Erro ao criar o perfil card:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao gerar seu card de perfil.' });
    }
};

module.exports = command;