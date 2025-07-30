// commands/menubrincadeiras.js

const { PREFIX } = require('../config');

const command = async (sock, m, jid) => {
    try {
        await sock.sendMessage(jid, { react: { text: '🎮', key: m.key } });

        const menuText = `
╭───⌈ 🎲 *MENU DE BRINCADEIRAS* ⌋
│
│ *Use um dos comandos abaixo para se divertir!*
│
├─ ⋅ ❉ ⋅ ─
│
│ 🧠 *QUIZ EM GRUPO*
│    \`${PREFIX}quiz\`
│    _(Um admin inicia e todos competem)_
│
│ 🎰 *CASSINO*
│    \`${PREFIX}apostar\`
│    _(Aposta suas moedas)_
│
├─ ⋅ ❉ ⋅ ─
│
│ ⭕ *JOGO DA VELHA*
│    \`${PREFIX}velha @oponente\`
│    _(Desafie um amigo para uma partida)_
│
├─ ⋅ ❉ ⋅ ─
│
│
│    \`${PREFIX}roubar\` 
│    _(tenta roubar moedas de outros membros)_
│
│
│    \`${PREFIX}fianca\` 
│    _(paga fianca de prisao)_
│
│    \`${PREFIX}vinganca\` 
│    _(para se vingar de um roubo)_
│
│
│ ☠️ *JOGO DA FORCA*
│    \`${PREFIX}forca\`
│    _(Tente adivinhar a palavra secreta)_
│
├─ ⋅ ❉ ⋅ ─
│
│ 🔂 *VERDADE OU DESAFIO*
│    \`${PREFIX}vdd\`
│    _(o nome ja diz)_
│
├─ ⋅ ❉ ⋅ ─
│
│ ✊ *PEDRA, PAPEL E TESOURA*
│    \`${PREFIX}ppt <pedra|papel|tesoura>\`
│    _(Jogue contra o bot e ganhe moedas)_
│
├─ ⋅ ❉ ⋅ ─
│
│ ❤️ *RELACIONAMENTOS*
│    \`${PREFIX}relacionamento\`
│    \`${PREFIX}beijar
│    \`${PREFIX}ship
│    _(Use ${PREFIX}help relacionamento para ver os detalhes)_
│
├─ ⋅ ❉ ⋅ ─
│
│ 📊 *MEDIDORES DIVERTIDOS*
│    \`${PREFIX}gay [@pessoa]\`
│    \`${PREFIX}corno [@pessoa]\`
│    \`${PREFIX}gado [@pessoa]\`
│    \`${PREFIX}gostosa [@pessoa]\`
│    \`${PREFIX}sapo [@pessoa]\`        // NOVO
│    \`${PREFIX}psicopata [@pessoa]\`   // NOVO
│    \`${PREFIX}preguica [@pessoa]\`    // NOVO
│    _(Mede porcentagens aleatórias)_
│
╰───────────────
        `.trim();

        await sock.sendMessage(jid, { text: menuText }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando menubrincadeiras:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao gerar o menu de brincadeiras.' }, { quoted: m });
    }
};

module.exports = command;