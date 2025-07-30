const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function getFileBuffer(midia, tipo) {
    const stream = await downloadContentFromMessage(midia, tipo);
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('base64');
}

module.exports = { getFileBuffer };
