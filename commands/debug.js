// commands/debug.js (Versão Completa e Formatada)

// Função auxiliar para checar e formatar o status de cada variável
const checkVar = (name, variable) => {
    // Define o status inicial
    let status = (variable !== undefined && variable !== null);
    const type = typeof variable;
    let valuePreview = 'N/A';

    // Se a variável existe, fazemos checagens adicionais
    if (status) {
        if (type === 'string' && variable.length === 0) status = false; // String vazia é um problema para chaves
        if (type === 'number' && variable === 0) status = false; // startTime como 0 é um problema

        // Prepara uma prévia do valor para exibir
        if (type === 'object') {
            valuePreview = Array.isArray(variable) ? `Array[${variable.length}]` : 'Objeto';
        } else {
            valuePreview = String(variable).substring(0, 50); // Mostra os primeiros 50 caracteres
        }
    }

    const emoji = status ? '✅' : '❌';
    const resultText = status ? `OK (Tipo: ${type})` : `ERRO (undefined/null/vazio)`;
    
    // Monta a linha do relatório
    return `${emoji} *${name}:* ${resultText}\n   └─ _Valor:_ \`${valuePreview}\``;
};

const command = async (sock, m, jid, configs, states) => {
    try {
        await sock.sendMessage(jid, { react: { text: '🩺', key: m.key } });

        // Monta o relatório completo
        let report = '🩺 *Relatório de Diagnóstico do Bot* 🩺\n\n';
        report += 'Verificando as variáveis principais que passam entre os arquivos.\n\n';

        report += '*--- ⚙️ Configurações (`configs`) ---*\n';
        report += checkVar('PREFIX', configs.PREFIX) + '\n';
        report += checkVar('API_KEY (Bronxys)', configs.API_KEY) + '\n';
        report += checkVar('GEMINI_API_KEY', configs.GEMINI_API_KEY) + '\n';
        report += checkVar('GEMINI_MODEL_NAME', configs.GEMINI_MODEL_NAME) + '\n';
        report += checkVar('OWNER_JID', configs.OWNER_JID) + '\n\n';

        report += '*--- 🔄 Estados (`states`) ---*\n';
        report += checkVar('startTime', states.startTime) + '\n';
        report += checkVar('userStates', states.userStates) + '\n';
        report += checkVar('gameStates', states.gameStates) + '\n';
        report += checkVar('commandTimestamps', states.commandTimestamps) + '\n';
        
        // Envia o relatório para o dono no WhatsApp
        await sock.sendMessage(jid, { text: report.trim() });
        
    } catch (e) {
        console.error("Erro no comando debug:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao gerar o relatório de diagnóstico.' });
    }
};

module.exports = command;