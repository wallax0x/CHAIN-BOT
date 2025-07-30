// commands/groupstats.js

// --- Importações ---
const { readX9Config } = require('../utils/x9_utils');
const { readAntiLinkConfig } = require('../commands/antilink');
const { readBrincadeirasConfig } = require('../commands/brincadeiras');
const { readConfig: readSimiConfig } = require('../commands/simi');
// --- NOVO: Importa a função de leitura do Anti-Fake ---
const { readConfig: readAntifakeConfig } = require('../commands/antifake');

const command = async (sock, m, jid) => {
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const metadata = await sock.groupMetadata(jid);

        // --- Leitura de todas as configurações ---
        const x9Config = await readX9Config();
        const antiLinkConfig = await readAntiLinkConfig();
        const brincadeirasConfig = await readBrincadeirasConfig();
        const simiConfig = await readSimiConfig();
        const antifakeConfig = await readAntifakeConfig(); // <-- NOVO

        // --- Verificação de todos os status ---
        const x9Status = x9Config[jid]?.enabled ? '✅ Ativado' : '❌ Desativado';
        const antiLinkStatus = antiLinkConfig[jid]?.enabled ? '✅ Ativado' : '❌ Desativado';
        const brincadeirasStatus = brincadeirasConfig[jid]?.enabled ? '✅ Ativado' : '❌ Desativado';
        const simiStatus = simiConfig[jid] === true ? '✅ Ativado' : '❌ Desativado';
        const antifakeStatus = antifakeConfig[jid] === true ? '✅ Ativado' : '❌ Desativado'; // <-- NOVO

        // --- Coleta de dados do grupo ---
        const totalMembers = metadata.participants.length;
        const totalAdmins = metadata.participants.filter(p => !!p.admin).length;
        const creationDate = new Date(metadata.creation * 1000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        // --- Montagem da mensagem final ---
        const statsMessage = `
📊 *ESTATÍSTICAS DO GRUPO* 📊

*Nome:* ${metadata.subject}
*ID:* \`\`\`${metadata.id}\`\`\`
*Criado em:* ${creationDate}

*👥 Membros:*
  - *Total:* ${totalMembers}
  - *Admins:* ${totalAdmins}

*⚙️ Configurações do Bot:*
  - *Sistema Anti-Link:* ${antiLinkStatus}
  - *Sistema Anti-Fake:* ${antifakeStatus}
  - *Sistema X9:* ${x9Status}
  - *Sistema de Brincadeiras:* ${brincadeirasStatus}
  - *Sistema Simi:* ${simiStatus}
`.trim(); // <-- NOVO: Adicionada a linha do Sistema Anti-Fake

        await sock.sendMessage(jid, { text: statsMessage }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando groupstats:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao obter as estatísticas do grupo.' }, { quoted: m });
    }
};

module.exports = command;