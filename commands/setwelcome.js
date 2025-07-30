/// commands/setwelcome.js (VERSÃO CORRIGIDA)

const fs = require('fs').promises;
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { PREFIX } = require('../config');
// Supondo que essas funções estejam em um arquivo de utilidades ou no próprio comando welcome
const { readWelcomeConfig, writeWelcomeConfig } = require('./welcome.js'); 

const WELCOME_IMAGES_DIR = path.resolve(__dirname, '../welcome_images');

async function ensureWelcomeImagesDir() {
    try {
        await fs.mkdir(WELCOME_IMAGES_DIR, { recursive: true });
    } catch (e) {
        console.error("Erro ao criar o diretório welcome_images:", e);
    }
}
ensureWelcomeImagesDir();


module.exports = async (sock, m, jid, args) => {
    try {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        }

        const subCommand = args[0]?.toLowerCase();
        if (subCommand === 'removermidia') {
            const config = await readWelcomeConfig();
            const groupConfig = config[jid];

            if (!groupConfig || (!groupConfig.imagePath && !groupConfig.message)) {
                return sock.sendMessage(jid, { text: 'ℹ️ Não há nenhuma configuração customizada para remover.' }, { quoted: m });
            }

            if (groupConfig.imagePath) {
                try {
                    await fs.unlink(groupConfig.imagePath);
                } catch (delError) {
                    if (delError.code !== 'ENOENT') console.error('Erro ao deletar mídia antiga:', delError);
                }
            }

            groupConfig.imagePath = null;
            groupConfig.mediaType = null;
            groupConfig.message = null; 
            await writeWelcomeConfig(config);

            return sock.sendMessage(jid, { text: '✅ Mídia e mensagem customizadas removidas! O bot voltará a usar as boas-vindas padrão.' }, { quoted: m });
        }
        
        const messageText = args.join(' ').trim();
        let mediaBuffer = null;
        let originalMediaType = null;

        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const currentMsg = m.message;
        const mediaSource = currentMsg.imageMessage || currentMsg.videoMessage ? currentMsg : (quoted?.imageMessage || quoted?.videoMessage ? quoted : null);
        
        if (mediaSource) {
            originalMediaType = mediaSource.imageMessage ? 'image' : 'video';
            const mediaContent = mediaSource.imageMessage || mediaSource.videoMessage;
            
            if (originalMediaType === 'video') {
                const duration = mediaContent.seconds || 0;
                if (duration > 10) {
                    return sock.sendMessage(jid, { text: '❌ Vídeo muito longo! Envie um com no máximo 10 segundos.' }, { quoted: m });
                }
            }
            
            const stream = await downloadContentFromMessage(mediaContent, originalMediaType);
            mediaBuffer = Buffer.from([]);
            for await (const chunk of stream) {
                // ✅ LINHA CORRIGIDA: Usa 'mediaBuffer' em vez de 'buffer'
                mediaBuffer = Buffer.concat([mediaBuffer, chunk]);
            }
        }

        const config = await readWelcomeConfig();
        if (!config[jid]) {
            config[jid] = { status: 0, message: null, imagePath: null, mediaType: null };
        }

        const finalMessage = messageText || (mediaSource?.imageMessage?.caption || mediaSource?.videoMessage?.caption);
        if (!finalMessage && !mediaBuffer) {
            return sock.sendMessage(jid, { text: `❓ Para definir, envie texto e/ou mídia. Para remover, use *${PREFIX}setwelcome removermidia*.` }, { quoted: m });
        }

        if (finalMessage) {
            config[jid].message = finalMessage;
        }

        if (mediaBuffer) {
            if (config[jid].imagePath) {
                try {
                    await fs.unlink(config[jid].imagePath);
                } catch (delError) {
                    if (delError.code !== 'ENOENT') console.error('Erro ao deletar mídia antiga:', delError);
                }
            }
            const fileExtension = originalMediaType === 'video' ? '.mp4' : '.jpg';
            const fileName = `${jid.split('@')[0]}${fileExtension}`;
            const filePath = path.join(WELCOME_IMAGES_DIR, fileName);
            await fs.writeFile(filePath, mediaBuffer);
            config[jid].imagePath = filePath;
            config[jid].mediaType = originalMediaType;
        }

        await writeWelcomeConfig(config);
        await sock.sendMessage(jid, { text: '✅ Configurações de boas-vindas salvas com sucesso!' }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando setwelcome:', e);
        return sock.sendMessage(jid, { text: '❌ Ocorreu um erro: ' + (e.message || ''), quoted: m });
    }
};