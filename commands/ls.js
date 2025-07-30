// commands/ls.js (VERSÃO AVANÇADA E SEGURA)
const fs = require('fs');
const path = require('path');

const command = async (sock, m, jid, args) => {
    try {
        // Define o diretório raiz do projeto do bot. 
        // __dirname é a pasta /commands, então '..' volta um nível para a raiz.
        const rootDir = path.resolve(__dirname, '..');
        
        // Se o usuário fornecer um subdiretório, usa. Se não, mostra a raiz.
        const subDir = args[0] || '';
        
        // Constrói o caminho completo e resolve para o caminho absoluto
        const targetPath = path.resolve(rootDir, subDir);

        // --- TRAVA DE SEGURANÇA ---
        // Verifica se o caminho final ainda está DENTRO do diretório raiz do bot.
        // Se não estiver, significa que houve uma tentativa de sair da "jaula" (ex: com ../).
        if (!targetPath.startsWith(rootDir)) {
            return sock.sendMessage(jid, { text: '❌ Acesso negado. Você só pode listar diretórios dentro da pasta do bot.' }, { quoted: m });
        }

        // Verifica se o caminho existe e é um diretório
        if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
            return sock.sendMessage(jid, { text: `❌ Diretório não encontrado: \`${subDir}\`` }, { quoted: m });
        }
        
        // Lê os arquivos e pastas do diretório alvo
        const items = fs.readdirSync(targetPath, { withFileTypes: true });

        const directories = items.filter(item => item.isDirectory()).map(item => item.name);
        const files = items.filter(item => item.isFile()).map(item => item.name);

        let responseText = `*📦 Conteúdo de: ./${subDir || ''}*\n\n`;

        if (directories.length > 0) {
            responseText += '*Pastas:*\n';
            directories.forEach(dir => {
                responseText += `\`📁 ${dir}/\`\n`;
            });
            responseText += '\n';
        }

        if (files.length > 0) {
            responseText += '*Arquivos:*\n';
            files.forEach(file => {
                responseText += `\`📄 ${file}\`\n`;
            });
        }

        if (directories.length === 0 && files.length === 0) {
            responseText += '_Este diretório está vazio._';
        }
        
        await sock.sendMessage(jid, { text: responseText.trim() }, { quoted: m });

    } catch (e) {
        console.error("Erro no comando ls:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao listar os arquivos.' }, { quoted: m });
    }
};

module.exports = command;