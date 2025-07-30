// commands/menumidia.js

const { PREFIX } = require('../config');

const command = async (sock, m, jid) => {
    try {
        await sock.sendMessage(jid, { react: { text: '🖼️', key: m.key } });

        const menuMediaText = `
╭───⌈ 🖼️ *MÍDIA & FIGURINHAS* ⌋
│
│ *Use um dos comandos abaixo para criar,*
│ *baixar ou editar mídias!*
│
├─ ⋅ ❉ *Figurinhas (Stickers)* ❉ ⋅ ─
│
│ ✨ *${PREFIX}figu* <img/video/gif>
│    _(Cria figurinhas quadradas ou animadas)_
│
│ 🔍 *${PREFIX}stickersearch* [texto]
│    _(Busca e cria uma figurinha)_
│
│ 📸 *${PREFIX}toimg* <respondendo sticker>
│    _(Converte uma figurinha em imagem)_
│ 📸 *${PREFIX}togif
│
│ ✍️ *${PREFIX}rename* <pack | autor>
│    _(Muda o nome do pacote da figurinha)_
│
│ ✨ *${PREFIX}attp*
│ 🔍 *${PREFIX}pinterest
│
├─ ⋅ ❉ *Downloads de Mídia* ❉ ⋅ ─
│
│ 🎵 *${PREFIX}play* [nome da música]
│ 📥 *${PREFIX}ytmp4* [url ou nome]
│ 🎶 *${PREFIX}tiktok* [link]
│ 💙 *${PREFIX}facebook* [link]
│ 📸 *${PREFIX}instagram* [link]
│ 📸 *${PREFIX}instaaudio* [link]
│ 🎶 *${PREFIX}spotify* [link]
│
├─ ⋅ ❉ *Edição & Ferramentas* ❉ ⋅ ─
│
│ 🎥 *${PREFIX}editvideo* [efeito]
│    _(Use ${PREFIX}editvideo para ver os efeitos)_
│
│ 🎙️ *${PREFIX}transcrever* <audio/video>
│    _(Converte áudio em texto)_
│
│ 🔊 *${PREFIX}audio* <efeito>
│    _(Aplica efeitos em áudios. Use ${PREFIX}audio)_
│
│ 🎵 *${PREFIX}tomp3* <respondendo vídeo>
│    _(Extrai o áudio de um vídeo)_
│
│ 🎶 *${PREFIX}letra* [nome da música]
│    _(Busca a letra de uma música)_
│
│ 🎙️ *${PREFIX}mediafire* 
│
├─ ⋅ ❉ *Montagens de Foto* ❉ ⋅ ─
│
│ *Responda a uma foto com um dos*
│ *comandos abaixo para aplicar o efeito:*
│
│ → \`${PREFIX}lixo\`
│ → \`${PREFIX}preso\`
│ → \`${PREFIX}procurado\`
│ → \`${PREFIX}hitler\`
│ → \`${PREFIX}borrar\`
│ → \`${PREFIX}lgbt\`
│ → \`${PREFIX}morto\`
│
╰───────────────
        `.trim();

        await sock.sendMessage(jid, { text: menuMediaText }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando menumidia:", e);
    }
};

module.exports = command;