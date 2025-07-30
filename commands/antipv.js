const fs = require('fs').promises;
const path = require('path');
const { PREFIX, OWNER_JID } = require('../config'); // Importa PREFIX e OWNER_JID

// Define o caminho para o arquivo JSON de configuração (na pasta 'json')
const ANTIPV_CONFIG_PATH = path.resolve(__dirname, '../json/antipv_config.json');

// Função para ler o arquivo de configuração
async function readAntipvConfig() {
    try {
        const data = await fs.readFile(ANTIPV_CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Se o arquivo não existe (ENOENT), significa que o modo está desativado por padrão
        if (error.code === 'ENOENT') {
            await writeAntipvConfig({ enabled: false }); // Cria o arquivo com o estado padrão
            return { enabled: false }; // Retorna o estado padrão
        }
        // Registra outros erros de leitura (ex: JSON inválido)
        console.error('Erro ao ler antipv_config.json:', error);
        return { enabled: false }; // Em caso de erro, padrão é desativado
    }
}

// Função para escrever no arquivo de configuração
async function writeAntipvConfig(config) {
    try {
        // Escreve o objeto de configuração no arquivo, formatado para facilitar a leitura
        await fs.writeFile(ANTIPV_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever antipv_config.json:', error);
    }
}

// O módulo principal do comando 'antipv'
module.exports = async (sock, m, jid, args, senderId) => { // 'senderId' é passado pelo handleCommand
    try {
        // 1. Verifica se quem está usando o comando é o dono do bot
        if (senderId !== OWNER_JID) {
            return sock.sendMessage(jid, { text: '❌ Apenas o dono do bot pode usar este comando.' }, { quoted: m });
        }

        const action = args[0]?.toLowerCase(); // Pega o primeiro argumento (on/off) e converte para minúsculas

        // 2. Valida o uso correto do comando (on ou off)
        if (!action || (action !== 'on' && action !== 'off')) {
            return sock.sendMessage(jid, { 
                text: `❌ *Uso incorreto do comando!* ✨\n\n` +
                      `Para ativar o modo Anti-PV, use:\n` +
                      `\`${PREFIX}antipv on\`\n\n` +
                      `Para desativar o modo Anti-PV, use:\n` +
                      `\`${PREFIX}antipv off\`\n\n` +
                      `_Quando ativo, o bot não responderá a mensagens privadas de não-donos._`, 
                quoted: m 
            });
        }

        // 3. Lê a configuração atual do modo 'antipv'
        const config = await readAntipvConfig();

        // Garante que o estado 'enabled' exista, se for a primeira vez
        if (config.enabled === undefined) { 
            config.enabled = false; 
        }

        // 4. Aplica a ação (ativar ou desativar)
        if (action === 'on') {
            // Se o modo já está ATIVADO, avisa e não faz nada
            if (config.enabled === true) {
                return sock.sendMessage(jid, { text: '⚠️ O modo *Anti-PV* já está **ATIVADO**.', quoted: m });
            }
            // Ativa o modo e salva
            config.enabled = true;
            await writeAntipvConfig(config);
            return sock.sendMessage(jid, { text: '✅ Modo *Anti-PV* ativado. O bot não responderá a mensagens privadas de não-donos.', quoted: m });
        } else if (action === 'off') {
            // Se o modo já está DESATIVADO, avisa e não faz nada
            if (config.enabled === false) {
                return sock.sendMessage(jid, { text: '⚠️ O modo *Anti-PV* já está **DESATIVADO**.', quoted: m });
            }
            // Desativa o modo e salva
            config.enabled = false;
            await writeAntipvConfig(config);
            return sock.sendMessage(jid, { text: '✅ Modo *Anti-PV* desativado. O bot voltará a responder a mensagens privadas de qualquer um.', quoted: m });
        }

    } catch (e) {
        console.error('Erro no comando antipv:', e); // Registra o erro no console
        // Envia uma mensagem de erro genérica para o usuário
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao processar o comando antipv. Por favor, tente novamente mais tarde.', quoted: m });
    }
};

// Exporta a função de leitura para ser usada por outros módulos (ex: messagesUpsertListener)
module.exports.readAntipvConfig = readAntipvConfig;