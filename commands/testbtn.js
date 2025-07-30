// commands/testbtn.js
module.exports = async (sock, m, jid) => {
    try {
        console.log("[TESTE DE BOTÃO] Tentando enviar a mensagem com botão...");

        const buttons = [{
            buttonId: 'test_id_1',
            buttonText: { displayText: 'Botão de Teste' },
            type: 1
        }];

        const buttonMessage = {
            text: "Esta é uma mensagem de teste com um botão.",
            footer: 'Se você consegue ver e clicar no botão, o envio está funcionando.',
            buttons: buttons,
            headerType: 1
        };

        await sock.sendMessage(jid, buttonMessage);

        console.log("[TESTE DE BOTÃO] A função sendMessage foi executada sem erros.");
        await sock.sendMessage(jid, { text: "O comando de teste foi executado. Verifique o console para logs." });

    } catch (e) {
        console.error("ERRO CRÍTICO AO ENVIAR BOTÃO DE TESTE:", e);
        await sock.sendMessage(jid, { text: `Ocorreu um erro GRAVE ao tentar enviar o botão: ${e.message}` });
    }
};