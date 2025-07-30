const qrcode = require('qrcode-terminal');
const delay = require('../utils/delay');

module.exports = async (sock, update, iniciarBotFunction, iniciarPresencaFunction) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp!');
        if (iniciarPresencaFunction) {
            await iniciarPresencaFunction(sock);
        }
    } else if (connection === 'close') {
        const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== require('@whiskeysockets/baileys').DisconnectReason.loggedOut);
        console.log('❌ Conexão fechada. Motivo:', lastDisconnect.error?.output?.statusCode || lastDisconnect.error);

        if (shouldReconnect) {
            console.log('🔄 Tentando reconectar em 5 segundos...');
            await delay(5000);
            iniciarBotFunction(); 
        } else {
            console.log('⚠️ Sessão encerrada. Por favor, delete a pasta "auth" e reinicie o bot para escanear o QR code.');
        }
    }

    if (qr) {
        qrcode.generate(qr, { small: true });
        console.log('📱 Escaneie o QR code acima para conectar o bot');
    }
};