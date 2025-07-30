// listeners/groupParticipantsUpdate.js (Versão Final e Corrigida)

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const axios = require('axios');
const { readWelcomeConfig } = require('../commands/welcome');
const { readAntifakeConfig, writeAntifakeConfig } = require('../commands/antifake.js');
const { readX9Config } = require('../utils/x9_utils');
// Se você usa o sistema de aluguel, descomente a linha abaixo
const { readRentals } = require('../utils/rental_checker'); 

// --- CAMINHOS PARA ARQUIVOS ---
const BG_PATH = path.resolve(__dirname, '..', 'assets', 'background.png');
const DEFAULT_PFP_PATH = path.resolve(__dirname, '..', 'assets', 'default_pfp.png');
const BLACKLIST_PATH = path.join(__dirname, '..', 'data', 'blacklist.json');


// --- FUNÇÃO AUXILIAR PARA LER A LISTA NEGRA ---
const readBlacklist = async () => {
    try {
        const data = await fs.readFile(BLACKLIST_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        console.error("Não foi possível ler o arquivo blacklist.json:", error);
        return [];
    }
};

// --- EXPORTAÇÃO PRINCIPAL DO LISTENER ---
module.exports = async (sock, data) => {
    // Bloco TRY principal para capturar qualquer erro fatal no evento
    try {
        const groupId = data.id;
        const participants = data.participants;
        const action = data.action;
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        // Se o bot foi removido, não há mais nada a fazer neste grupo.
        if (action === 'remove' && participants.includes(botId)) {
            return console.log(`[EVENTO] Fui removido do grupo: ${groupId}.`);
        }

        // Verifica se o bot foi adicionado a um novo grupo (lógica de aluguel)
        if (action === 'add' && participants.includes(botId)) {
            console.log(`[EVENTO] Fui adicionado ao grupo: ${groupId}.`);
            // Adicione aqui sua lógica completa de verificação de aluguel...
            // Ex: const rentals = await readRentals(); if (!rentals[groupId]) { await sock.sendMessage(...); await sock.groupLeave(groupId); }
            return; // Retorna para não processar o bot como um novo membro
        }

        const metadata = await sock.groupMetadata(groupId);
        const groupName = metadata.subject;
        const botIsAdmin = !!metadata.participants.find(p => p.id === botId)?.admin;

        // Lógica de X9 para PROMOVER/REBAIXAR
        if (action === 'promote' || action === 'demote') {
            try {
                const x9Config = await readX9Config();
                if (x9Config[groupId]?.enabled === true) {
                    const targetUser = participants[0];
                    const actionText = action === 'promote' ? 'agora é um administrador!' : 'não é mais um administrador!';
                    const x9Message = `👀 *Alerta X9:* @${targetUser.split('@')[0]} ${actionText}`;
                    await sock.sendMessage(groupId, { text: x9Message, mentions: [targetUser] });
                }
            } catch (x9Error) {
                console.error("[X9 Listener] Ocorreu um erro:", x9Error);
            }
        }

        // --- LOOP PRINCIPAL PARA PROCESSAR CADA PARTICIPANTE (ENTRADA/SAÍDA) ---
        for (const participantId of participants) {
            if (participantId === botId) continue;

            // LÓGICA PARA QUANDO ALGUÉM ENTRA NO GRUPO
            if (action === 'add') {
                let wasRemoved = false;

                if (botIsAdmin) {
                    // 1º: VERIFICAÇÃO ANTI-FAKE
                    try {
                        const antifakeConfig = await readAntifakeConfig();
                        if (antifakeConfig[groupId] === true && !participantId.startsWith('55')) {
                            await sock.sendMessage(groupId, { text: `👽 *Anti-Fake Ativado:* Número estrangeiro (@${participantId.split('@')[0]}) detectado e removido.`, mentions: [participantId] });
                            await sock.groupParticipantsUpdate(groupId, [participantId], 'remove');
                            wasRemoved = true;
                        }
                    } catch (antifakeError) { console.error("[AntiFake] Ocorreu um erro:", antifakeError); }
                    
                    if (wasRemoved) continue; // Se foi removido, pula para o próximo participante

                    // 2º: VERIFICAÇÃO DA LISTA NEGRA
                    try {
                        const blacklist = await readBlacklist();
                        if (blacklist.includes(participantId)) {
                            await sock.sendMessage(groupId, { text: `🚫 O usuário @${participantId.split('@')[0]} foi removido automaticamente por estar na lista de restrição.`, mentions: [participantId] });
                            await sock.groupParticipantsUpdate(groupId, [participantId], 'remove');
                            wasRemoved = true;
                        }
                    } catch (blacklistError) { console.error("[Lista Negra] Ocorreu um erro:", blacklistError); }
                }
                if (wasRemoved) continue;

                // 3º: MENSAGEM DE BOAS-VINDAS
                const welcomeConfig = await readWelcomeConfig();
                const groupSettings = welcomeConfig[groupId];
                if (groupSettings?.status === 1) {
                    const welcomeCaption = (groupSettings.message || `👋 Bem-vindo(a) ao {nome_grupo}, {membro}!`)
                        .replace(/{membro}/g, `@${participantId.split('@')[0]}`)
                        .replace(/{nome_grupo}/g, groupName);

                    // Verifica se há mídia customizada
                    if (groupSettings.imagePath && groupSettings.mediaType) {
                        try {
                            const mediaBuffer = await fs.readFile(groupSettings.imagePath);
                            await sock.sendMessage(groupId, { [groupSettings.mediaType]: mediaBuffer, caption: welcomeCaption, mentions: [participantId] });
                        } catch (customMediaError) {
                            console.error("[Welcome] Falha ao enviar mídia customizada, enviando texto.", customMediaError);
                            await sock.sendMessage(groupId, { text: welcomeCaption, mentions: [participantId] });
                        }
                    } else {
                        // Lógica para gerar imagem padrão (se não houver customizada)
                        try {
                            const backgroundBuffer = await fs.readFile(BG_PATH);
                            const canvas = sharp(backgroundBuffer).resize(1280, 720);
                            let pfpBuffer;
                            try {
                                const pfpUrl = await sock.profilePictureUrl(participantId, 'image');
                                const response = await axios.get(pfpUrl, { responseType: 'arraybuffer' });
                                pfpBuffer = Buffer.from(response.data, 'binary');
                            } catch {
                                pfpBuffer = await fs.readFile(DEFAULT_PFP_PATH);
                            }
                            const circlePfp = await sharp(pfpBuffer).resize(250, 250).composite([{ input: Buffer.from('<svg><circle cx="125" cy="125" r="125"/></svg>'), blend: 'dest-in' }]).png().toBuffer();
                            const memberName = participantId.split('@')[0];
                            const svgText = `<svg width="1000" height="300"><style>.title { fill: #ffffff; font-size: 60px; font-weight: bold; font-family: "Sans"; text-shadow: 2px 2px 4px #000000; } .subtitle { fill: #eeeeee; font-size: 40px; font-family: "Sans"; text-shadow: 2px 2px 4px #000000;}</style><text x="50%" y="80" text-anchor="middle" class="title">BEM-VINDO(A)!</text><text x="50%" y="160" text-anchor="middle" class="subtitle">@${memberName}</text><text x="50%" y="220" text-anchor="middle" class="subtitle">ao grupo ${groupName}</text></svg>`;
                            const finalImageBuffer = await canvas.composite([{ input: circlePfp, top: 180, left: 515 }, { input: Buffer.from(svgText), top: 420, left: 140 }]).jpeg().toBuffer();
                            await sock.sendMessage(groupId, { image: finalImageBuffer, caption: welcomeCaption, mentions: [participantId] });
                        } catch (defaultImgError) {
                            console.error("[Welcome] Falha ao gerar imagem padrão. Enviando texto.", defaultImgError);
                            await sock.sendMessage(groupId, { text: welcomeCaption, mentions: [participantId] });
                        }
                    }
                }
            } 
            // LÓGICA PARA QUANDO ALGUÉM SAI DO GRUPO
            else if (action === 'remove') {
                const welcomeConfig = await readWelcomeConfig();
                const groupSettings = welcomeConfig[groupId];
                if (groupSettings?.goodbyeMessage) {
                    const goodbyeMessage = groupSettings.goodbyeMessage.replace(/{membro}/g, `@${participantId.split('@')[0]}`);
                    await sock.sendMessage(groupId, { text: goodbyeMessage, mentions: [participantId] });
                }
            }
        } // Fim do loop 'for'
    } catch (e) { // Catch do TRY principal
        console.error("Erro fatal no listener group-participants.update:", e);
    }
};