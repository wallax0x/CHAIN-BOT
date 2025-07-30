// listeners/messagesUpsert.js

const { gameStates } = require('../data/games.js');
const { handleVelhaMove } = require('../commandHandler/handleVelhaMove.js'); 
const { readMutedMembersConfig } = require('../commands/mute');
const { getRandomGoodMorning, getRandomGoodAfternoon, getRandomGoodNight, getRandomHello } = require('../utils/greetings');
const { addXp } = require('../utils/xp_manager.js');
const { OWNER_JID } = require('../config');
const { PREFIX } = require('../config');
const { readAntipvConfig } = require('../commands/antipv');
const { readXpOptinConfig } = require('../commands/gerenciarxp');
const { readAntiLinkConfig } = require('../commands/antilink'); 
const { readAfkData, writeAfkData } = require('../commands/afk');
const { activeGames } = require('../commands/vdd.js'); 
const truthOrDareData = require('../data/truth_or_dare.json');
const { checkAnswer: checkQuizAnswer } = require('../commands/quiz');
const simiManager = require('../utils/simi_manager');
const { readConfig: readSimiConfig } = require('../commands/simi');
const { readDuels, writeDuels } = require('../commands/duelo'); 
const banallCommand = require('../commands/banall');
const { banallConfirmations } = require('../commands/banall');
const { getDevice } = require('@whiskeysockets/baileys');
//mindo que as funções estão em duelo.js
const { readConfig: readAutorespostaConfig } = require('../commands/autoresposta');
const fs = require('fs'); // Para funções síncronas como existsSync
const fsp = require('fs').promises; 
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const DEVICE_LOG_PATH = path.join(__dirname, '..', 'data', 'device_log.json');
const { downloadInstagramContent } = require('../commands/instagram.js');
const { downloadYoutubeVideo } = require('../commands/ytmp4.js');
const { downloadTiktokVideo } = require('../commands/tiktok.js');
let statsLock = Promise.resolve();
const { updateUserStat } = require('../utils/stats_manager.js');
const { downloadFacebookVideo } = require('../commands/facebook.js');
const { readAutoDeleteConfig } = require('../commands/mute2');



//verdade ou desafio beta
const thinkingMessages = ["Hmm, boa escolha... 😈", "Deixa eu ver no meu caderninho de maldades...", "Procurando algo BEM interessante... 🤔"];
const commentaryMessages = ["Quero só ver! 👀", "Não pode amarelar agora! 💪", "O grupo todo está de olho... 🧐"];



//algumas funcoes xp etc download
async function downloadMedia(m) {
    const type = Object.keys(m.message)[0];
    const stream = await downloadContentFromMessage(m.message[type], type.replace('Message', ''));

    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

const lastXpGainTime = {};
const XP_GAIN_COOLDOWN = 5000;

const autostickerPath = path.join(__dirname, '..', 'json', 'autosticker.json');

let autostickerGroups = [];
if (fs.existsSync(autostickerPath)) {
    try {
        autostickerGroups = JSON.parse(fs.readFileSync(autostickerPath));
    } catch (e) {
        console.error('Erro ao carregar autosticker.json:', e);
    }
}
// Função para ler o log de dispositivos
const readDeviceLog = () => {
    try {
        if (fs.existsSync(DEVICE_LOG_PATH)) {
            const data = fs.readFileSync(DEVICE_LOG_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Erro ao ler device_log.json:", e);
    }
    return {};
};

// Função para escrever no log de dispositivos
const writeDeviceLog = (data) => {
    try {
        fs.writeFileSync(DEVICE_LOG_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Erro ao escrever em device_log.json:", e);
    }
};



// ASSINATURA CORRETA E FINAL
module.exports = async (sock, data, muteFilter, handleCommand, PREFIX, API_KEY, userStates, startTime, gameStates, commandTimestamps) => {
    // ===================================================================
    // INÍCIO DA LÓGICA DE ESCUTA DO JOGO DA VELHA (MÁXIMA PRIORIDADE)
    // ===================================================================
    try {
        // Pega as variáveis essenciais DENTRO deste bloco para garantir que existam
        const m_game = data.messages[0];
        if (m_game && m_game.message && !m_game.key.fromMe) {
            const jid_game = m_game.key.remoteJid;
            const senderId_game = m_game.key.participant || m_game.key.remoteJid;
            const isGroup_game = jid_game.endsWith('@g.us');
            const body_game = (m_game.message.conversation || m_game.message.extendedTextMessage?.text || '').trim();

            // Adicione este log para depuração final
            console.log(`[UPSERT-CHECK] JID: ${jid_game}, Remetente: ${senderId_game}, Mensagem: "${body_game}"`);
            
            // Requer as funções aqui dentro para garantir que estão carregadas
            const { gameStates } = require('../data/games.js');
            const { handleVelhaMove } = require('../commandHandler/handleVelhaMove.js');

            const gameState = gameStates[jid_game];
            if (isGroup_game && gameState?.isActive && (senderId_game === gameState.player1.id || senderId_game === gameState.player2.id)) {
                const move = parseInt(body_game);
                if (!isNaN(move) && move >= 1 && move <= 9) {
                    console.log(`[VELHA-MOVE] Jogada "${move}" detectada de ${senderId_game}. Processando...`);
                    await handleVelhaMove(sock, m_game, jid_game, body_game);
                    return; // PARA A EXECUÇÃO E NÃO PROCESSA MAIS NADA
                }
            }
        }
    } catch (gameError) {
        console.error('[ERRO NO OUVINTE DO JOGO DA VELHA]', gameError);
    }
    // ===================================================================
    // FIM DA LÓGICA DO JOGO DA VELHA
    // O RESTO DO SEU CÓDIGO messagesUpsert CONTINUA DAQUI PARA BAIXO
    // ===================================================================
    const m = data.messages[0];

    if (!m.message || m.key.fromMe) {
        return;
    }

    const jid = m.key.remoteJid;
    const senderId = m.key.participant || m.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const messageText = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
    
   // --- LÓGICA DE ESCUTA DO JOGO DA VELHA (VERSÃO CORRETA) ---
    const gameState = gameStates[jid];
    if (isGroup && gameState?.isActive && (senderId === gameState.player1.id || senderId === gameState.player2.id)) {
        const move = parseInt(body);
        // Verifica se a mensagem é um número de 1 a 9
        if (!isNaN(move) && move >= 1 && move <= 9) {
            await handleVelhaMove(sock, m, jid, body);
            return; // IMPORTANTE: Para a execução aqui para não processar como comando.
        }
    }
    // --- FIM DA LÓGICA DO JOGO DA VELHA ---

        // --- LÓGICA DO VERDADE OU DESAFIO (EXECUTADA PRIMEIRO) ---
        if (activeGames.has(jid)) {
            const game = activeGames.get(jid);

            if (senderId === game.challenged) {
                const choice = messageText.toLowerCase().trim();

                if (['verdade', 'desafio', 'surpresa'].includes(choice)) {
                    activeGames.delete(jid); 
                    await sock.sendMessage(jid, { react: { text: '🎲', key: m.key } });

                    let finalChoice = choice;
                    if (choice === 'surpresa') {
                        finalChoice = Math.random() < 0.5 ? 'verdade' : 'desafio';
                        await sock.sendMessage(jid, { text: `A roleta girou... e caiu em... *${finalChoice.toUpperCase()}!*` });
                        await delay(1500);
                    }
                    
                    const randomThinkingMsg = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
                    await sock.sendMessage(jid, { text: randomThinkingMsg });
                    await delay(2500);

                    if (finalChoice === 'verdade') {
                        const randomTruth = truthOrDareData.truths[Math.floor(Math.random() * truthOrDareData.truths.length)];
                        const truthCard = `╭─── • 🤔 *VERDADE* • ───╮\n│\n│  *Para:* @${senderId.split('@')[0]}\n│\n│  *Pergunta:*\n│  _${randomTruth}_\n│\n╰────────────────╯`;
                        await sock.sendMessage(jid, { text: truthCard.trim(), mentions: [senderId] });
                    } else { // Desafio
                        const randomDare = truthOrDareData.dares[Math.floor(Math.random() * truthOrDareData.dares.length)];
                        const dareCard = `╭─── • 😈 *DESAFIO* • ───╮\n│\n│  *Para:* @${senderId.split('@')[0]}\n│\n│  *Sua missão é:*\n│  _${randomDare}_\n│\n╰────────────────╯`;
                        await sock.sendMessage(jid, { text: dareCard.trim(), mentions: [senderId] });
                    }

                    // --- PARTE NOVA: PASSANDO A VEZ PARA O PRÓXIMO JOGADOR ---
                    await delay(2000); 
                    const randomCommentary = commentaryMessages[Math.floor(Math.random() * commentaryMessages.length)];
                    const nextTurnMessage = `${randomCommentary}\n\nPronto! Agora é sua vez de desafiar, @${senderId.split('@')[0]}! Use \`.vdd @alguem\` para escolher a próxima vítima.`;
                    await sock.sendMessage(jid, { text: nextTurnMessage, mentions: [senderId] });
                    // --- FIM DA PARTE NOVA ---
                    
                    return; // Para a execução para não processar a resposta como um comando normal
                }
            }
        }
        
    

        // Se não for uma resposta do jogo, continua para os comandos normais
        if (body.startsWith(PREFIX)) {
            // Entrega a mensagem para o gerenciador de comandos.
            await handleCommand(sock, m, gameStates);
        }
    
    
    // --- LÓGICA DE ESCUTA PARA CONFIRMAÇÃO DO BANALL ---
if (isGroup) {
    const confirmationState = banallConfirmations[jid];
    const message = messageText.trim().toLowerCase();

    // Verifica se há um pedido pendente para este usuário e se a mensagem é 's' ou 'n'
    if (confirmationState && confirmationState.requesterId === senderId && (message === 's' || message === 'n')) {
        // Se for, chama o comando banall passando a mensagem como argumento
        await banallCommand(sock, m, jid, [message], PREFIX);
        return; // Para a execução aqui para não ser processado como um comando normal
    }
}
// --- FIM DA LÓGICA DE ESCUTA ---
    
    
    // ✅ BLOCO DE COLETA DE DADOS FINAL E SIMPLIFICADO
if (jid.endsWith('@g.us') && senderId) {
    // Notifica o gerenciador para registrar uma mensagem
    updateUserStat(jid, senderId, 'msg');

    if (body.startsWith(PREFIX)) {
        // Notifica para registrar um comando
        updateUserStat(jid, senderId, 'cmd');

        const commandName = body.slice(PREFIX.length).trim().split(/ +/).shift().toLowerCase();
        if (['figu', 'sticker', 's'].includes(commandName)) {
            // Notifica para registrar uma figurinha
            updateUserStat(jid, senderId, 'figu');
        }
    }
}
    // --- FIM DO BLOCO DE COLETA ---
    
    // ===================================================================
    // INÍCIO DO BLOCO DE DOWNLOAD AUTOMÁTICO (VERSÃO CORRIGIDA)
    // ===================================================================

    // --- BLOCO DE DOWNLOAD AUTOMÁTICO (CORRIGIDO PARA IGNORAR COMANDOS) ---
    
    // Garanta que a variável PREFIX esteja definida no seu arquivo. Ex: const PREFIX = '.';
    
    // ADICIONADO: Esta condição verifica se a mensagem NÃO começa com o prefixo.
    if (!body.startsWith(PREFIX)) {

        // ✅ Detector do Facebook
        const facebookRegex = /(https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/(?:watch\/?\?v=|video\.php\?v=|\S+\/videos\/\S+|reel\/\S+)[^\s]+)/i;
        const matchedFacebookUrl = body.match(facebookRegex);
        if (matchedFacebookUrl) {
            console.log(`[AUTO-DL] Link do Facebook detectado: ${matchedFacebookUrl[0]}`);
            // Corrigi 'msg' para 'm' para manter a consistência com os outros
            await downloadFacebookVideo(sock, m, jid, matchedFacebookUrl[0]);
            return; 
        }
    
        // --- Verificador Automático de Links do Instagram ---
        const instagramRegex = /(https:\/\/www\.instagram\.com\/(reel|p)\/[a-zA-Z0-9_-]+)/i;
        const matchedUrl = body.match(instagramRegex);
        if (matchedUrl) {
            console.log(`[INSTA-AUTO] Link do Instagram detectado: ${matchedUrl[0]}`);
            await downloadInstagramContent(sock, m, jid, matchedUrl[0]);
            return;
        }
    
        // --- Verificador Automático de Links do YouTube ---
        const youtubeRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[a-zA-Z0-9_-]{11})/i;
        const matchedYtUrl = body.match(youtubeRegex);
        if (matchedYtUrl) {
            console.log(`[YT-AUTO] Link do YouTube detectado: ${matchedYtUrl[0]}`);
            await downloadYoutubeVideo(sock, m, jid, matchedYtUrl[0]);
            return;
        }
    
        // --- Verificador do TikTok ---
        const tiktokRegex = /(https?:\/\/(?:www\.|vm\.)?tiktok\.com\/.+)/i;
        const matchedTiktokUrl = body.match(tiktokRegex);
        if (matchedTiktokUrl) {
            console.log(`[AUTO-DL] Link do TikTok detectado: ${matchedTiktokUrl[0]}`);
            await downloadTiktokVideo(sock, m, jid, matchedTiktokUrl[0]);
            return;
        }
    } // ADICIONADO: Fecha o bloco do 'if'
    // --- FIM DO BLOCO DE DOWNLOAD AUTOMÁTICO ---



    // ===================================================================
    // FIM DO BLOCO DE DOWNLOAD AUTOMÁTICO
    // ===================================================================

    
    // --- LÓGICA DE APRENDIZAGEM DE DISPOSITIVO ---
try {
    // Pega o dispositivo da mensagem atual
    const device = getDevice(m.key.id);
    if (device) {
        const deviceLog = readDeviceLog();
        // Salva ou atualiza o dispositivo do usuário no log
        if (deviceLog[senderId] !== device) {
            deviceLog[senderId] = device;
            writeDeviceLog(deviceLog);
            // console.log(`[Device-Logger] Dispositivo de ${senderId} salvo como: ${device}`);
        }
    }
} catch (e) {
    // Erro silencioso para não poluir o console
}
// --- FIM DA LÓGICA DE APRENDIZAGEM ---
    
    

    //acho que aqui e logica autosticker
   try {
     if (isGroup && autostickerGroups.includes(jid)) {
        const msgType = Object.keys(m.message || {})[0];

        if (msgType === 'imageMessage') {
            const stream = await downloadContentFromMessage(m.message.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const sticker = new Sticker(buffer, {
                type: StickerTypes.FULL,
                pack: 'AutoSticker',
                author: 'SeuBot',
            });

            const stickerBuffer = await sticker.toBuffer();

            await sock.sendMessage(jid, {
                sticker: stickerBuffer,
            }, { quoted: m });
        }
    }
} catch (e) {
    console.error('[Autosticker] Erro ao converter imagem em figurinha:', e);
}
    
    //FIM DA LOGICA AUTOSTICKER
    
    
    // ... (sua definição de jid, senderId, isGroup, isSenderAdmin, etc.)

    
    // --- NOVO: BLOCO DE LÓGICA AFK ---
    if (isGroup) {
        const afkData = await readAfkData();
        
        // 1. VERIFICA SE O AUTOR DA MENSAGEM ESTAVA AFK E O TRAZ DE VOLTA
        if (afkData[senderId]) {
            const afkInfo = afkData[senderId];
            const timeAfk = Math.floor((Date.now() - afkInfo.time) / 1000); // Tempo em segundos
            const hours = Math.floor(timeAfk / 3600);
            const minutes = Math.floor((timeAfk % 3600) / 60);

            let welcomeBackMessage = `👋 Bem-vindo(a) de volta, @${senderId.split('@')[0]}!`;
            if (hours > 0 || minutes > 0) {
                 welcomeBackMessage += ` Você esteve ausente por aproximadamente ${hours > 0 ? hours + 'h' : ''} ${minutes}min.`;
            }

            await sock.sendMessage(jid, { text: welcomeBackMessage, mentions: [senderId] });
            
            delete afkData[senderId]; // Remove o usuário do modo AFK
            await writeAfkData(afkData);
        }

        // 2. VERIFICA SE A MENSAGEM MENCIONA ALGUÉM QUE ESTÁ AFK
        const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        for (const mentionedId of mentionedJids) {
            if (afkData[mentionedId]) {
                const afkInfo = afkData[mentionedId];
                const afkResponseMessage = `ℹ️ O usuário @${mentionedId.split('@')[0]} está ausente (AFK).\n*Motivo:* ${afkInfo.reason}`;
                
                // Responde à mensagem que fez a menção
                await sock.sendMessage(jid, { text: afkResponseMessage, mentions: [mentionedId] }, { quoted: m });
            }
        }
    }
    // --- FIM DO BLOCO AFK ---
    
    // --- LÓGICA DE RESPOSTA AO MENCIONAR O DONO ---
if (isGroup) {
    // Pega a lista de todas as pessoas mencionadas na mensagem
    const mentionedJids = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    // Verifica se:
    // 1. Alguém foi de fato mencionado na mensagem.
    // 2. A pessoa que enviou a mensagem NÃO é um dos donos (para evitar que o bot responda a si mesmo).
    if (mentionedJids.length > 0 && !OWNER_JID.includes(senderId)) {
        
        // Agora, verifica se um dos JIDs na lista de menções pertence a um dono
        const ownerIsMentioned = mentionedJids.some(mentionedJid => OWNER_JID.includes(mentionedJid));

        if (ownerIsMentioned) {
            console.log(`[INFO] O Dono foi mencionado por ${senderId} no grupo ${jid}. Enviando resposta automática.`);
            
            // O bot irá responder à mensagem, avisando que o dono está ocupado.
            // Escolha uma das opções de texto abaixo ou crie a sua!
            
            // --- OPÇÃO 1: MENSAGEM FORMAL E ÚTIL ---
            const responseText = `Olá, @${senderId.split('@')[0]}! Meu criador foi notificado, mas pode estar ocupado no momento. Se precisar de ajuda com os comandos, por favor, utilize o comando *.menu*.`;

            // --- OPÇÃO 2: MENSAGEM MAIS DESCONTRAÍDA ---
            // const responseText = `Opa, @${senderId.split('@')[0]}! Recado anotado, mas meu mestre não está disponível agora. Enquanto isso, que tal um *.menu* para ver o que eu posso fazer? 😉`;

            await sock.sendMessage(jid, {
                text: responseText,
                mentions: [senderId] // Marca a pessoa que chamou o dono
            }, { quoted: m });
        }
    }
}
// --- FIM DA LÓGICA DE MENCAO DO DONO ---
    
    // ... (depois de definir jid, senderId, isGroup, messageText)

    const mensagem = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || '';
    
    
    // --- NOVO: BLOCO DE VERIFICAÇÃO DE RESPOSTA DO QUIZ ---
    if (isGroup && mensagem.length === 1) { // Só verifica mensagens de 1 caractere para otimizar
        await checkQuizAnswer(sock, m, jid, senderId, mensagem);
    }
    // --- FIM DO BLOCO DO QUIZ ---

    

    const shouldProceed = await muteFilter(sock, m, jid, senderId, isGroup);
    if (!shouldProceed) return;

    if (!isGroup) {
        const antipvConfig = await readAntipvConfig();
        if (antipvConfig.enabled && senderId !== OWNER_JID) {
            await sock.sendMessage(jid, { text: '❌ O bot não aceita mensagens privadas no momento.' }, { quoted: m });
            return;
        }
    }

    if (!mensagem) {
        return;
    }

    // ====================================================================
// SUBSTITUA O BLOCO DE SAUDAÇÕES DO SEU LISTENER POR ESTE CÓDIGO
// ====================================================================

// --- INÍCIO DO BLOCO DE AUTO-RESPOSTAS (VERSÃO FINAL INTELIGENTE) ---
try {
    // Lê a configuração do comando !autoresposta
    const autorespostaConfig = await readAutorespostaConfig();
    
    // Só executa se a função estiver ativa para o grupo e não for um comando
    if (isGroup && autorespostaConfig[jid] === true && !mensagem.startsWith(PREFIX)) {
        const lowerCaseMsg = mensagem.toLowerCase();
        let response = null;

        // 1. Lida com saudações genéricas como "oi" e "olá" primeiro
        if (lowerCaseMsg === 'oi' || lowerCaseMsg === 'ola' || lowerCaseMsg === 'olá') {
            response = getRandomHello();
        } 
        // 2. Se não for um "oi", verifica se é uma saudação de período do dia
        else if (lowerCaseMsg.includes('bom dia') || lowerCaseMsg.includes('boa tarde') || lowerCaseMsg.includes('boa noite')) {
            const currentHour = new Date().getHours();
            
            // Lógica inteligente baseada no horário atual
            if (currentHour >= 5 && currentHour < 12) {
                response = getRandomGoodMorning();
            } else if (currentHour >= 12 && currentHour < 18) {
                response = getRandomGoodAfternoon();
            } else {
                response = getRandomGoodNight();
            }
        }
        
        // Se alguma resposta foi definida, envia
        if (response) {
            await sock.sendMessage(jid, { text: response }, { quoted: m });
        }
    }
} catch (autorespostaError) {
    console.error("[Autoresposta] Ocorreu um erro no bloco de saudações:", autorespostaError);
}
// --- FIM DO BLOCO DE AUTO-RESPOSTAS ---

    if (isGroup) {
        const xpOptinConfig = await readXpOptinConfig();
        if (xpOptinConfig[senderId] === true) {
            const now = Date.now();
            if ((now - (lastXpGainTime[senderId] || 0)) > XP_GAIN_COOLDOWN) {
                lastXpGainTime[senderId] = now;
                const xpGained = Math.floor(Math.random() * 10) + 5;
                await addXp(senderId, jid, xpGained);
            }
        }
    }
    
    // --- BLOCO ANTI-LINK ATUALIZADO ---
    if (isGroup) {
        const antiLinkConfig = await readAntiLinkConfig();
        // Expressão regular para detectar links de forma mais ampla
        const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;

        // 1. Verifica primeiro se a função está ativa E se a mensagem contém um link
        if (antiLinkConfig[jid]?.enabled && linkRegex.test(mensagem)) {
            
            // 2. Se contém um link, AGORA verificamos quem enviou
            const metadata = await sock.groupMetadata(jid);
            const senderIsAdmin = !!metadata.participants.find(p => p.id === senderId)?.admin;
            
            // 3. Se o remetente FOR um admin, apenas avisa (Sua Sugestão)
            if (senderIsAdmin) {
                // Mensagem de aviso para o admin, confirmando que o sistema viu o link mas não agiu.
                // Usamos 'm.key' para responder diretamente à mensagem do admin.
                await sock.sendMessage(jid, { text: `ℹ️ Link detectado. Ação de remoção não aplicada, pois o autor é um administrador.` }, { quoted: m });
                
                // IMPORTANTE: Não usamos 'return' aqui. Isso permite que um admin use um comando que contenha um link (ex: !play <link_do_youtube>).
                // O código continuará a ser processado normalmente para o admin.

            } else {
                // 4. Se o remetente NÃO for um admin, aplica a punição
                console.log(`[Anti-Link] Link detectado de ${senderId} no grupo ${jid}. Removendo...`);

                // Envia uma mensagem de aviso antes de remover, para que a pessoa saiba o motivo
                await sock.sendMessage(jid, {
                    text: `🚫 Membro @${senderId.split('@')[0]} está sendo removido por enviar um link, o que não é permitido pelas regras deste grupo.`,
                    mentions: [senderId]
                });

                // Deleta a mensagem com o link
                await sock.sendMessage(jid, { delete: m.key });

                // Remove o usuário do grupo
                await sock.groupParticipantsUpdate(jid, [senderId], 'remove');
                
                // Para a execução do código aqui para não processar mais nada desta mensagem
                return; 
            }
        }
    }
    // --- FIM DO BLOCO ANTI-LINK
    
// --- INÍCIO DO BLOCO DE LÓGICA DO SIMI ---
try {
    const simiConfig = await readSimiConfig();
    
    if (isGroup && simiConfig[jid] === true && !mensagem.startsWith(PREFIX)) {
        
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const currentMessageText = m.message?.conversation || m.message?.extendedTextMessage?.text;

        // Lógica de APRENDIZADO
        if (quoted && currentMessageText) {
            const triggerText = quoted.conversation || quoted.extendedTextMessage?.text;

            if (triggerText && currentMessageText) {
                // A linha que enviava a reação com '🧠' foi removida daqui.
                // Agora ele apenas aprende silenciosamente.
                await simiManager.learn(triggerText, currentMessageText);
            }
        } 
        // Lógica de RESPOSTA
        else if (currentMessageText) {
            const response = await simiManager.getResponse(currentMessageText);
            
            if (response) {
                await new Promise(resolve => setTimeout(resolve, 800));
                await sock.sendMessage(jid, { text: response }, { quoted: m });
            }
        }
    }
} catch (simiError) {
    console.error("[Simi] Ocorreu um erro dentro do bloco Simi:", simiError);
}
// --- FIM DO BLOCO DE LÓGICA DO SIMI ---
    
    // --- NOVO: BLOCO PARA REGISTRAR VOTOS DO DUELO ---
// Verifica se a mensagem é no privado e se é um comando de voto
if (!isGroup && mensagem.startsWith('.voto')) {
    const keyword = mensagem.split(' ')[1];
    
    if (keyword) {
        const duels = await readDuels();
        let foundDuel = false;

        for (const groupId in duels) {
            const duel = duels[groupId];
            if (!duel.isActive) continue;

            let targetDuelist = null;
            if (duel.duelist1.voteKeyword === keyword) targetDuelist = duel.duelist1;
            if (duel.duelist2.voteKeyword === keyword) targetDuelist = duel.duelist2;

            if (targetDuelist) {
                // Verifica se o usuário já votou
                if (duel.duelist1.votes.includes(senderId) || duel.duelist2.votes.includes(senderId)) {
                    await sock.sendMessage(senderId, { text: `⚠️ Você já votou neste duelo!` });
                } else {
                    targetDuelist.votes.push(senderId);
                    await writeDuels(duels);
                    await sock.sendMessage(senderId, { text: `✅ Voto para *${targetDuelist.name}* registrado com sucesso!` });
                }
                foundDuel = true;
                break;
            }
        }
        if (!foundDuel) {
            await sock.sendMessage(senderId, { text: `❌ Código de votação inválido ou o duelo já foi encerrado.` });
        }
    }
}
// --- FIM DO BLOCO DE VOTOS ---
    
    const isCommandWithPrefix = mensagem.trim().startsWith(PREFIX);
    if (!isCommandWithPrefix) {
        return;
    }

    let isBotAdmin = false, isSenderAdmin = false;
    if (isGroup) {
        try {
            const metadata = await sock.groupMetadata(jid);
            isBotAdmin = !!metadata.participants.find(p => p.id === sock.user.id)?.admin;
            isSenderAdmin = !!metadata.participants.find(p => p.id === senderId)?.admin;
        } catch (err) { console.error('Erro ao obter metadados:', err); }
    }
    
   // --- LÓGICA DE AUTO-DELEÇÃO DE MENSAGENS ---
if (isGroup && senderId) { // Só funciona em grupo e se tiver um remetente
    // Medida de segurança: NUNCA apagar mensagens de um admin
    if (!isSenderAdmin) {
        const autoDeleteConfig = await readAutoDeleteConfig();
        const groupMarkedList = autoDeleteConfig[jid] || [];

        // Se o autor da mensagem estiver na lista de mutados...
        if (groupMarkedList.includes(senderId)) {
            console.log(`[AUTO-DELETE] Apagando mensagem de ${senderId} no grupo ${jid}.`);
            try {
                // ...o bot apaga a mensagem dele.
                await sock.sendMessage(jid, { delete: m.messages[0].key });
                return; // Para a execução do script para não processar mais nada
            } catch (deleteError) {
                console.error('[AUTO-DELETE] Falha ao apagar mensagem. O bot é admin?', deleteError);
            }
        }
    }
}
// --- FIM DA LÓGICA ---
    
    
    const args = mensagem.trim().slice(PREFIX.length).trim().split(/ +/);
    const comando = args.shift().toLowerCase();

    // CHAMADA FINAL CORRIGIDA E ALINHADA
    await handleCommand(
        sock,
        m,
        jid,
        senderId,
        body,
        isGroup,
        isBotAdmin,
        isSenderAdmin,
        isCommandWithPrefix,
        comando,
        args,
        PREFIX,
        API_KEY,
        userStates,
        startTime,
        gameStates,
        commandTimestamps
    );
};