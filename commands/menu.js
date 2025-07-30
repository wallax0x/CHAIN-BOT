// commands/menu.js
const path = require('path');
const fs = require('fs');
const { getUptime } = require('../utils/uptime');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async (sock, m, jid, PREFIX) => {
    try {
        await sock.sendMessage(jid, { react: { text: '📖', key: m.key } });

        // --- LÓGICA DO ÁUDIO (Mantida) ---
        const audioPath = path.resolve(__dirname, '..', 'assets', 'menu_intro.mp3');
        if (fs.existsSync(audioPath)) {
            await sock.sendMessage(jid, {
                audio: { url: audioPath },
                mimetype: 'audio/mpeg',
                ptt: true
            });
            await delay(200);
        }

        // --- ANIMAÇÃO DE CARREGAMENTO (Primeira Mensagem) ---
        const sentMsg = await sock.sendMessage(jid, { text: 'Iniciando menu...' });

        for (let i = 0; i <= 10; i++) {
            const percentage = i * 10;
            const progressBar = '█'.repeat(i) + '░'.repeat(10 - i);
            const loadingText = `*Carregando Menu...* ⏳\n\n[${progressBar}] ${percentage}%`;
            
            await sock.sendMessage(jid, { text: loadingText, edit: sentMsg.key });
            await delay(90);
        }
        
        // Edita a mensagem uma última vez para indicar que o carregamento terminou
        await sock.sendMessage(jid, { text: '✅ *Menu Carregado!*', edit: sentMsg.key });
        // --- FIM DA ANIMAÇÃO ---


        // --- ENVIO DO MENU FINAL (Segunda Mensagem) ---
        const uptime = getUptime();
        const menuText = `

┏━〔 🔥 *CHAIN BETA* 🔥 〕━┓
┃ 🤖 *Online há:* ${uptime}
┃ 👑 *Dono:* wallax
┗━━━━━━━━━━━━━━━━━━━┛

╭───⌈ 🤖 *MENUS* ⌋
│ 📖 ${PREFIX}menu
│ 🎲 ${PREFIX}menubrincadeiras
│ 🔰 ${PREFIX}menuadm
│ 🌌 ${PREFIX}menumidia
╰───────────────

╭───⌈ 🤖 *BOT & UTILIDADES* ⌋
│ 🏅 ${PREFIX}topativos
│ 🙏 ${PREFIX}conselhobiblico
│ ❓ ${PREFIX}help [comando]
│ 📡 ${PREFIX}ping
│ 📰 ${PREFIX}noticias
│ 🐞 ${PREFIX}bug [texto] sugestões
│ ✍️ ${PREFIX}gerarnick [texto]
│ ✍️ ${PREFIX}resumir [em teste]
│ ☁️ ${PREFIX}clima [cidade]
│ 📚 ${PREFIX}wiki
│ 🆔 ${PREFIX}fakeid
│ 🆔 ${PREFIX}fakechat
│ ♈  ${PREFIX}signo
│ 🏅 ${PREFIX}esportes
│ 📸 ${PREFIX}print [site]
│ 📬 ${PREFIX}correio <número> / <msg>
│ 🗣️ ${PREFIX}falar
│ 🤖 ${PREFIX}simih [mensagem]
│ ⚖️ ${PREFIX}obesidade peso/altura
│ 🎬 ${PREFIX}filme
│ 😜 ${PREFIX}emojimix
│ ⏰ ${PREFIX}lembrete
│ 🔡 ${PREFIX}ascii
│ 🧤 ${PREFIX}thanos
│ 💻 ${PREFIX}dispositivos
│ 🌐 ${PREFIX}ddd
╰───────────────

╭───⌈ 👤 *PERFIL & ECONOMIA* ⌋
│ ☀️ ${PREFIX}daily
│ 👤 ${PREFIX}perfil [@membro]
│ 👤 ${PREFIX}perfilcard [sem modulo]
│ 🏆 ${PREFIX}rank xp | moedas
│ 🛍️ ${PREFIX}loja
│ 💰 ${PREFIX}comprar <item>
│ 💸 ${PREFIX}pix @membro <valor>
│ ✅ ${PREFIX}ativarxp
│ ❌ ${PREFIX}desativarxp
│ 💰 ${PREFIX}moedas
╰───────────────

╭───⌈ ✨ *IA - INTELIGÊNCIA ARTIFICIAL* ⌋
│ 🤖 ${PREFIX}gemini [pergunta]
│ 🎨 ${PREFIX}geimage [descrição]
│ 🎙️ ${PREFIX}transcrever <respondendo áudio>
╰───────────────

╭───⌈ 👑 *DONO DO BOT* ⌋
│ ⚙️ ${PREFIX}antispam on | off
│ 🚪 ${PREFIX}aluguel <link> <dias>
│ 🌐 ${PREFIX}mygroups
│ 🌐 ${PREFIX}transmissao
│ 🌐 ${PREFIX}xpfix
│ ⚙️ ${PREFIX}ls
│ ⚙️ ${PREFIX}setbotpp
╰───────────────

encontrou um bug ou tem alguma sugestao ? envie .bug

`.trim();
        
        const videoPath = path.resolve(__dirname, '..', 'assets', 'menu.mp4');

        if (fs.existsSync(videoPath)) {
            await sock.sendMessage(jid, {
                video: { url: videoPath },
                caption: menuText,
                mimetype: 'video/mp4',
                gifPlayback: true
            }, { quoted: m });
        } else {
            // Se o vídeo não for encontrado, envia o menu como texto
            await sock.sendMessage(jid, { text: menuText }, { quoted: m });
        }

    } catch (e) {
        console.error("❌ Erro ao enviar o menu:", e);
        await sock.sendMessage(jid, { text: "❌ Ocorreu um erro ao gerar o menu." }, { quoted: m });
    }
};