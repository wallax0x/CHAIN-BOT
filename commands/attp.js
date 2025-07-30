module.exports = async (sock, m, jid, args, API_KEY, PREFIX, command) => {
    try {
        const query = args.join(' ').trim(); // Pega o texto completo passado como argumento

        if (!query) {
            return sock.sendMessage(jid, { text: '❌ Por favor, forneça o texto para a figurinha. Ex: * ${PREFIX}limpar attp Olá Mundo*' }, { quoted: m });
        }

        if (!API_KEY) {
            console.error('API_KEY não está definida para o comando attp.');
            return sock.sendMessage(jid, { text: '❌ A chave da API para a figurinha animada não está configurada corretamente no bot.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: 'AGUARDE, REALIZANDO AÇÃO.' }, { quoted: m });

        // Define a fonte baseada no comando usado
        // Você pode ajustar esses nomes de fonte se a API da Bronxys Host especificar outros
        const Fontes = command === "attp2" ? "Roboto" : "Noto Emoji, Noto Sans Mono";
        
        const attpUrl = `https://api.bronxyshost.com.br/api-bronxys/attp_edit?texto=${encodeURIComponent(query)}&fonte=${encodeURIComponent(Fontes)}&apikey=${API_KEY}`;

        // Envia a figurinha diretamente via URL
        await sock.sendMessage(jid, { sticker: { url: attpUrl } }, { quoted: m }).catch(e => {
            console.error('Erro ao enviar figurinha ATTP:', e);
            return sock.sendMessage(jid, { text: '❌ Erro ao criar ou enviar a figurinha. Tente novamente mais tarde.' }, { quoted: m });
        });

    } catch (e) {
        console.error('Erro no comando attp:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro inesperado ao processar a figurinha ATTP.' }, { quoted: m });
    }
};