const fs = require('fs').promises;

const path = require('path');

const { readWelcomeConfig } = require('../commands/welcome'); // Caminho relativo

module.exports = async (sock, data) => {

    const groupId = data.id;

    const participants = data.participants;

    const action = data.action;

    const welcomeConfig = await readWelcomeConfig();

    const groupSettings = welcomeConfig[groupId];

    if (!groupSettings || groupSettings.status !== 1 || !groupSettings.message) {

        return;

    }

    const botId = sock.user.id.includes('@s.whatsapp.net') ? sock.user.id : sock.user.id.split(':')[0] + '@s.whatsapp.net';

    let groupName = 'o grupo';

    try {

        const metadata = await sock.groupMetadata(groupId);

        groupName = metadata.subject || 'o grupo';

    } catch (error) {

        console.error(`Erro ao obter nome do grupo ${groupId}:`, error);

    }

    for (const participantId of participants) {

        if (participantId === botId) {

            continue;

        }

        let messageToSend = groupSettings.message;

        

        messageToSend = messageToSend.replace(/{membro}/g, `@${participantId.split('@')[0]}`);

        messageToSend = messageToSend.replace(/{nome_grupo}/g, groupName);

        // --- LÓGICA CONSOLIDADA PARA ENVIAR MENSAGEM COM/SEM MÍDIA ---

        if (action === 'add') { // Apenas para entradas no grupo (Welcome)

            let messageOptions = { text: messageToSend, mentions: [participantId] };

            if (groupSettings.imagePath && groupSettings.mediaType) {

                try {

                    const mediaBuffer = await fs.readFile(groupSettings.imagePath);

                    if (groupSettings.mediaType === 'image') {

                        messageOptions = {

                            image: mediaBuffer,

                            caption: messageToSend,

                            mimetype: 'image/jpeg',

                            mentions: [participantId]

                        };

                    } else if (groupSettings.mediaType === 'video') {

                        messageOptions = {

                            video: mediaBuffer,

                            caption: messageToSend,

                            mimetype: 'video/mp4',

                            mentions: [participantId]

                        };

                    }

                } catch (error) {

                    console.error(`Erro ao carregar mídia de boas-vindas do caminho ${groupSettings.imagePath}:`, error);

                    // Se houver erro, envia apenas o texto

                    messageOptions = { text: messageToSend, mentions: [participantId] };

                }

            }

            await sock.sendMessage(groupId, messageOptions);

        } else if (action === 'remove') { // Para saídas do grupo (Despedida)

            // Mensagens de saída são apenas texto por padrão, sem imagem personalizada

            await sock.sendMessage(groupId, { text: `👋 Adeus, @${participantId.split('@')[0]}!`, mentions: [participantId] });

        }

        // --- FIM DA LÓGICA CONSOLIDADA ---

    }

};