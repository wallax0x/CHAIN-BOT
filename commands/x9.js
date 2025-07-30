// commands/x9.js

const { readX9Config, writeX9Config } = require('../utils/x9_utils');
const { PREFIX } = require('../config');

// O comando !x9 on/off
const command = async (sock, m, jid, args) => {
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }
        
        const action = args[0]?.toLowerCase();
        if (action !== 'on' && action !== 'off') {
            return sock.sendMessage(jid, { text: `❓ Uso incorreto. Use *${PREFIX}x9 on* ou *${PREFIX}x9 off*.` }, { quoted: m });
        }

        // Reage à mensagem para dar feedback
        await sock.sendMessage(jid, { react: { text: '👀', key: m.key } });

        const config = await readX9Config();
        const groupConfig = config[jid] || { enabled: false };

        if (action === 'on') {
            if (groupConfig.enabled) return sock.sendMessage(jid, { text: '⚠️ O sistema X9 já está ativado.' }, { quoted: m });
            
            config[jid] = { enabled: true };
            await writeX9Config(config);
            return sock.sendMessage(jid, { text: '✅ Sistema X9 ativado! Ficarei de olho em tudo que acontece.' }, { quoted: m });
        } else { // off
            if (!groupConfig.enabled) return sock.sendMessage(jid, { text: '⚠️ O sistema X9 já está desativado.' }, { quoted: m });

            config[jid].enabled = false;
            await writeX9Config(config);
            return sock.sendMessage(jid, { text: '❌ Sistema X9 desativado.' }, { quoted: m });
        }
    } catch (e) {
        console.error('Erro no comando x9:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar o comando X9.' }, { quoted: m });
    }
};

module.exports = command;