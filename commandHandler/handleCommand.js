// commandHandler/handleCommand.js

// --- IMPORTAÇÃO ORGANIZADA DE TODOS OS COMANDOS ---

// Comandos que exportam uma única função
const path = require('path');
const fs = require('fs').promises;
const mediafireCommand = require('../commands/mediafire');
const beijarCommand = require('../commands/beijar');
const instaaudioCommand = require('../commands/instaaudio');
const { command: antifakeCommand } = require('../commands/antifake');
const dCommand = require('../commands/d');
const addCommand = require('../commands/add');
const antispamCommand = require('../commands/antispam');
const antipvCommand = require('../commands/antipv');
const attpCommand = require('../commands/attp');
const banCommand = require('../commands/ban');
const banallCommand = require('../commands/banall');
const bugCommand = require('../commands/bug');
const comprarCommand = require('../commands/comprar');
const dailyCommand = require('../commands/daily');
const demoteCommand = require('../commands/demote');
const facebookCommand = require('../commands/facebook');
const { command: figuCommand } = require('../commands/figu.js');
const geminiCommand = require('../commands/gemini');
const grupoCommand = require('../commands/grupo');
const groupstatsCommand = require('../commands/groupstats');
const imgpralinkCommand = require('../commands/imgpralink');
const instagramCommand = require('../commands/instagram');
const levelCommand = require('../commands/level');
const limparCommand = require('../commands/limpar');
const lojaCommand = require('../commands/loja');
const marcarallCommand = require('../commands/marcarall');
const menuCommand = require('../commands/menu');
const muteCommand = require('../commands/mute');
const mygroupsCommand = require('../commands/mygroups');
const pedirnamoroCommand = require('../commands/pedirnamoro');
const perfilCommand = require('../commands/perfil');
const pingCommand = require('../commands/ping');
const playCommand = require('../commands/play');
const printCommand = require('../commands/print');
const promoverCommand = require('../commands/promover');
const qrcodeCommand = require('../commands/qrcode');
const rankCommand = require('../commands/rank');
const renameCommand = require('../commands/rename');
const reverseCommand = require('../commands/reverse');
const audioCommand = require('../commands/audio');
const setwelcomeCommand = require('../commands/setwelcome');
const signoCommand = require('../commands/signo');
const sorteioCommand = require('../commands/sorteio');
const toimgCommand = require('../commands/toimg');
const transcreverCommand = require('../commands/transcrever');
const welcomeCommand = require('../commands/welcome');
const x9Command = require('../commands/x9');
const ytmp4Command = require('../commands/ytmp4');
const gerenciarXpCommand = require('../commands/gerenciarxp');
const tiktokCommand = require('../commands/tiktok');
const imgCommand = require('../commands/img');
const correioCommand = require('../commands/correio');
const desenharCommand = require('../commands/desenhar');
const testbtnCommand = require('../commands/testbtn');
const antilinkCommand = require('../commands/antilink');
const { command: relacionamentoCommand } = require('../commands/relacionamento.js');
const helpCommand = require('../commands/help');
const afkCommand = require('../commands/afk');
const { startQuiz } = require('../commands/quiz');
const seticonCommand = require('../commands/seticon');
const moedasCommand = require('../commands/moedas');
const esportesCommand = require('../commands/esportes');
const aluguelCommand = require('../commands/aluguel');
const geimageCommand = require('../commands/geimage');
const gerarnickCommand = require('../commands/gerarnick');
const pptCommand = require('../commands/ppt');
const spotifyCommand = require('../commands/spotify');
const { command: simiCommand } = require('../commands/simi');
const simihCommand = require('../commands/simih');
const { command: dueloCommand } = require('../commands/duelo');
const tomp3Command = require('../commands/tomp3');
const medidorCommand = require('../commands/medidor');
const menubrincadeirasCommand = require('../commands/menubrincadeiras');
const { command: autorespostaCommand } = require('../commands/autoresposta');
const roletarussaCommand = require('../commands/roletarussa');
const { command: soadmsCommand } = require('../commands/soadms.js');
// Comandos que exportam um objeto { command, ... }
const { command: brincadeirasCommand } = require('../commands/brincadeiras');
const { readConfig: readAdminOnlyConfig } = require('../commands/soadms');
const { command: velhaCommand } = require('../commands/velha');
const climaCommand = require('../commands/clima');
const pixCommand = require('../commands/pix');
const letramusicCommand = require('../commands/letramusic');
const forcaCommand = require('../commands/forca');
const menuadmCommand = require('../commands/menuadm');
const stickersearchCommand = require('../commands/stickersearch');
const editvideoCommand = require('../commands/editvideo');
const montagemCommand = require('../commands/montagem');
const menumidiaCommand = require('../commands/menumidia');
const wikiCommand = require('../commands/wiki');
const falarCommand = require('../commands/falar');
const abrirCommand = require('../commands/abrir');
// Importação de utilitários e configs
const { readAntiSpamConfig } = require('../commands/antispam');
const { incrementTotalCommandCount } = require('../utils/stats_manager');
const { OWNER_JID } = require('../config');
const obesidadeCommand = require('../commands/obesidade');
const lsCommand = require('../commands/ls');
const filmeCommand = require('../commands/filme');
const blockcmdCommand = require('../commands/blockcmd');
const unblockcmdCommand = require('../commands/unblockcmd');
const listblockedCommand = require('../commands/listblocked');
const emojimixCommand = require('../commands/emojimix');
const lembreteCommand = require('../commands/lembrete');
const asciiCommand = require('../commands/ascii');
const thanosCommand = require('../commands/thanos');
const pinterestCommand = require('../commands/pinterest.js');
const fakeidCommand = require('../commands/fakeid');
const noticiasCommand = require('../commands/noticias');
const { command: togifCommand } = require('../commands/togif.js');
const setbotppCommand = require('../commands/setbotpp.js');
const listanegraCommand = require('../commands/listanegra.js');
const setgoodbyeCommand = require('../commands/setgoodbye.js');
const vddCommandModule = require('../commands/vdd.js');
const dispositivosCommand = require('../commands/dispositivos.js');
const dispositivoCommand = require('../commands/dispositivo.js');
const curiosidadeCommand = require('../commands/curiosidade.js');
const shipCommand = require('../commands/ship.js');
const transmissaoCommand = require('../commands/transmissao.js');
const xpfixCommand = require('../commands/xpfix.js');
const xpdebugCommand = require('../commands/xpdebug.js');
const dddCommand = require('../commands/ddd.js');
const apostarCommand = require('../commands/apostar.js');
const conselhoCommand = require('../commands/conselho.js');
const topativosCommand = require('../commands/topativos.js');
const hidetagCommand = require('../commands/hidetag.js');
const { command: fakechatCommand } = require('../commands/fakechat.js');
const roubarCommand = require('../commands/roubar.js'); 
const { command: pagarfiancaCommand } = require('../commands/pagarfianca.js');
const vingancaCommand = require('../commands/vinganca.js');
const { command: actCommand } = require('../commands/act.js');
const mute2 = require('../commands/mute2');
const vddCommand = vddCommandModule.command;




// --- FUNÇÃO PRINCIPAL DO HANDLER ---
module.exports = async (sock, m, jid, senderId, body, isGroup, isBotAdmin, isSenderAdmin, isCommandWithPrefix, comando, args, PREFIX, API_KEY, userStates, startTime, gameStates, commandTimestamps) => {
    
    
    
    // --- NOVO LOG DE DIAGNÓSTICO ---
        console.log(`[DEBUG-HANDLER] Comando recebido: "${comando}"`);
        console.log(`[DEBUG-HANDLER] ID do Remetente (senderId): "${senderId}"`);
        console.log(`[DEBUG-HANDLER] Lista de Donos (OWNER_JID):`, OWNER_JID);
        console.log(`[DEBUG-HANDLER] O remetente está na lista de donos?`, OWNER_JID ? OWNER_JID.includes(senderId) : 'Lista de donos não definida (undefined)');
        // --- FIM DO LOG ---
    
    // --- LÓGICA DE VERIFICAÇÃO DE COMANDO BLOQUEADO ---
    const BLOCKED_CMDS_PATH = path.resolve(__dirname, '../json/blocked_cmds.json');
    try {
        const data = await fs.readFile(BLOCKED_CMDS_PATH, 'utf8');
        const blockedCmds = JSON.parse(data || '{}');
        const groupBlocked = blockedCmds[jid] || [];

        // Se o comando está na lista de bloqueados E o usuário não é admin...
        if (groupBlocked.includes(comando) && !isSenderAdmin) {
            // ...envia o aviso e para tudo.
            await sock.sendMessage(jid, { text: `🚫 O comando \`${comando}\` foi desativado por um administrador neste grupo.` }, { quoted: m });
            return; 
        }
    } catch (e) {
        // Ignora o erro se o arquivo não existir pela primeira vez
        if (e.code !== 'ENOENT') console.error("Erro ao ler comandos bloqueados:", e);
    }
    // --- FIM DA LÓGICA DE VERIFICAÇÃO ---
    
    // --- BLOCO DE VERIFICAÇÃO "SÓ ADMS" (CORRIGIDO) ---

// 'isGroup' é a variável que você já deve ter, que verifica se o 'jid' termina com '@g.us'
if (isGroup) { // <<< ADICIONAMOS ESTA VERIFICAÇÃO EXTERNA
    
    const isAdminOnly = await readAdminOnlyConfig(jid); // Lê a configuração para o grupo atual

    // Se a trava estiver ativa...
    if (isAdminOnly) {
        const groupMetadata = await sock.groupMetadata(jid);
        // 'senderId' deve ser a variável com o ID do remetente
        const sender = groupMetadata.participants.find(p => p.id === senderId); 

        // ...E o remetente NÃO for um admin...
        if (!sender || (sender.admin !== 'admin' && sender.admin !== 'superadmin')) {
            console.log(`[SÓ ADMS] Comando "${comando}" bloqueado para ${senderId} no grupo ${jid}.`);
            return; // ...interrompe a execução do comando silenciosamente.
        }
    }
}
// --- FIM DO BLOCO ---

        if ((comando === 'debug' || comando === 'ls') && OWNER_JID.includes(senderId)) {
    if (comando === 'debug') {
        await debugCommand(sock, m, jid, configs, states);
    } else if (comando === 'ls') {
        await lsCommand(sock, m, jid, args);
    }
    return; // Para a execução aqui
}
    
    if (isCommandWithPrefix && senderId !== OWNER_JID) {
        const antiSpamConfig = await readAntiSpamConfig();
        if (antiSpamConfig.enabled) {
            const now = Date.now();
            const userTimestamp = commandTimestamps[senderId] || { lastTime: 0, warned: false };
            const timeDiff = now - userTimestamp.lastTime;
            const COOLDOWN = 5000;

            if (timeDiff < COOLDOWN) {
                if (!userTimestamp.warned) {
                    const timeLeft = Math.ceil((COOLDOWN - timeDiff) / 1000);
                    sock.sendMessage(jid, { text: `⏳ Por favor, aguarde ${timeLeft} segundo(s).` }, { quoted: m });
                    commandTimestamps[senderId].warned = true;
                }
                return;
            }
            commandTimestamps[senderId] = { lastTime: now, warned: false };
        }
    }
    
    if (isGroup && isCommandWithPrefix) {
        const adminOnlyConfig = await readAdminOnlyConfig();
        if (adminOnlyConfig[jid] === true && !isSenderAdmin && comando !== 'soadms') {
            return sock.sendMessage(jid, { text: '⚠️ O bot está em modo *Apenas Administradores*.' }, { quoted: m });
        }
    }

    const forcaCommands = ['forca', 'letra', 'palavra'];
    if (isCommandWithPrefix && forcaCommands.includes(comando)) {
        await forcaCommand(sock, m, jid, args, comando, PREFIX); 
        
        return;
    } 

    if (!isCommandWithPrefix) return;

    const adminCommands = ['ban', 'fechar', 'abrir', 'marcarall', 'add', 'promover', 'welcome', 'setwelcome', 'demote', 'mute', 'unmute', 'x9', 'groupstats', 'banall', 'soadms', 'brincadeiras', 'limpar', 'sorteio', 'antilink', 'd', 'seticon', 'simi', 'roletarussa', 'menuadm', 'unblockcmd', 'unblockcmd', 'autosticker', 'listanegra', 'setgoodbye', 'mute2', 'unmute2']; 
    if (adminCommands.includes(comando)) {
        if (!isGroup) return sock.sendMessage(jid, { text: '❌ Este comando só pode ser usado em grupos.' }, { quoted: m });
        if (!isSenderAdmin) return sock.sendMessage(jid, { text: '⚠️ Apenas administradores do grupo podem usar este comando.' }, { quoted: m });
    }

    if (comando !== 'antispam') {
        
    }
    
    switch (comando) {
        // Comandos do Dono
        case 'simi':
          await simiCommand(sock, m, jid, args);
          break;
            case 'conselho':
case 'conselhobiblico':
case 'versiculo':
    // ✅ Corrigido: Adicionado 'args' na chamada da função
    await conselhoCommand(sock, m, jid, args);
    break;
            
            case 'pagarfianca':
case 'fianca':
    await pagarfiancaCommand(sock, m, jid);
    break;

            case 'xpdebug':
    await xpdebugCommand(sock, m, jid);
    break;
            case 'act':
        await actCommand(sock, m, jid);
        break;
            case 'mute2':
    case 'unmute2':
        await mute2(sock, m, jid, args, comando);
        break;
            case 'xpfix':
    await xpfixCommand(sock, m, jid);
    break;
            case 'roubar':
    await roubarCommand(sock, m, jid, args);
    break;
            case 'apostar':
case 'cassino': // Adicionando um atalho
    await apostarCommand(sock, m, jid, args);
    break;
          case 'dispositivos':
case 'devices':
    await dispositivosCommand(sock, m, jid, args);
    break;
            case 'fakechat':
case 'fq':
case 'fk':
    // Agora passamos apenas os parâmetros que ele realmente precisa
    await fakechatCommand(sock, m, jid, args);
    break;
         case 'curiosidade':
    await curiosidadeCommand(sock, m, jid, args);
    break;
         case 'ship':
         
          await shipCommand(sock, m, jid, args);
          
          break;
            case 'topativos':

    await topativosCommand(sock, m, jid);
    break;
            
         case 'vdd':
case 'verdadeoudesafio':
    await vddCommand(sock, m, jid, args);
    break;
        case 'setgoodbye':
    await setgoodbyeCommand(sock, m, jid, args);
    break;
        case 'togif':
    await togifCommand(sock, m, jid, args, PREFIX);
    break;
            case 'listanegra':
    await listanegraCommand(sock, m, jid, args);
    break;
            
        case 'setbotpp':
    await setbotppCommand(sock, m, jid, args);
    break;
            case 'hidetag':
case 'tagall':
case 'tagger':
    await hidetagCommand(sock, m, jid, args);
    break;

        case 'noticias':
    await noticiasCommand(sock, m, jid, args);
    break;
        case 'fakeid':
    await fakeidCommand(sock, m, jid, args, PREFIX);
    break;
       case 'autosticker':
    require('../commands/autosticker')(sock, m, jid, args, PREFIX);
    break;

       case 'pinterest':
    await pinterestCommand(sock, m, jid, args);
    break;
       case 'thanos':
    await thanosCommand(sock, m, jid, args);
    break;
        case 'dispositivo':
    await dispositivoCommand(sock, m, jid, args);
    break;
        case 'lembrete':
case 'remind':
    await lembreteCommand(sock, m, jid, args, senderId);
    break;
      case 'blockcmd':
        // Lembre-se de adicionar 'blockcmd' à sua lista de validação de admin
        await blockcmdCommand(sock, m, jid, args);
        break;
     case 'ascii':
case 'figlet':
    await asciiCommand(sock, m, jid, args);
    break;

    case 'unblockcmd':
        // Lembre-se de adicionar 'unblockcmd' à sua lista de validação de admin
        await unblockcmdCommand(sock, m, jid, args);
        break;

    case 'listblocked':
        await listblockedCommand(sock, m, jid);
        break;
        case 'mediafire':
case 'mf':
    await mediafireCommand(sock, m, jid, args);
    break;
       case 'obesidade':
case 'imc':
    await obesidadeCommand(sock, m, jid, args);
    break;
        case 'abrir':
    await abrirCommand(sock, m, jid, args, senderId);
    break;
        case 'antifake':

    await antifakeCommand(sock, m, jid, args);

    break;
            case 'ddd':
    await dddCommand(sock, m, jid, args);
    break;
        case 'letramusic':
          await letramusicCommand(sock, m, jid, args);
          break;
        case 'emojimix':
case 'mixemoji':
    await emojimixCommand(sock, m, jid, args);
    break;
         
         case 'menuadm':
    await menuadmCommand(sock, m, jid, PREFIX);
    break;
        case 'gay':
case 'corno':
case 'gado':
case 'gostosa':
case 'sapo':      // NOVO
case 'psicopata': // NOVO
case 'preguica':  // NOVO
    await medidorCommand(sock, m, jid, args, senderId, comando, isGroup);
    break;
        case 'autoresposta':
           await autorespostaCommand(sock, m, jid, args);
           break;
        case 'stickersearch':
    await stickersearchCommand(sock, m, jid, args);
    break;
case 'editvideo':
    // Agora passamos os 'args' para o comando, para que ele possa ler o efeito
    await editvideoCommand(sock, m, jid, args);
    break;
    case 'transmissao':
        await transmissaoCommand(sock, m, jid, args, PREFIX);
        break;

    case 'filme':
case 'series':
case 'movie':
           
    await filmeCommand(sock, m, jid, args);
    break;
            case 'vinganca':
    await vingancaCommand(sock, m, jid);
    break;
          case 'lixo':
case 'lgbt':
case 'morto':
case 'preso':
case 'deletem':
case 'procurado':
case 'hitler':
case 'borrar':
case 'merda':
    await montagemCommand(sock, m, jid, comando);
    break;
        case 'tomp3':
          await tomp3Command(sock, m, jid);
          break;
          case 'beijar':
    await beijarCommand(sock, m, jid, args, senderId);
    break;
        case 'roletarussa':
          await roletarussaCommand(sock, m, jid, args, senderId);
          break;
         case 'wiki':
case 'wikipedia':
    await wikiCommand(sock, m, jid, args);
    break;
        case 'falar':
case 'gtts':
    await falarCommand(sock, m, jid, args);
    break;
            case 'level':
    await levelCommand(sock, m, jid, args);
    break;
         case 'menumidia':
    await menumidiaCommand(sock, m, jid, PREFIX);
    break;
        case 'duelo':
        case 'encerrarvoto':
            await dueloCommand(sock, m, jid, args, senderId, isSenderAdmin, comando, PREFIX);
            break;
        case 'simih':
            await simihCommand(sock, m, jid, args);
            break;
        case 'menubrincadeiras':
           await menubrincadeirasCommand(sock, m, jid, PREFIX);
           break;
        case 'antispam':
            await antispamCommand(sock, m, jid, args, senderId);
            break;
        case 'instaaudio':
        case 'insta_audio': // atalho com o nome original
            await instaaudioCommand(sock, m, jid, args);
            break;
        case 'spotify':
    // Este comando usa a chave principal (Bronxys), que já é passada para o handler
            await spotifyCommand(sock, m, jid, args);
            break;
        case 'gerarnick':
            await gerarnickCommand(sock, m, jid, args);
            break;
        case 'afk':
            await afkCommand(sock, m, jid, args, senderId);
            break;
        case 'help':
        case 'ajuda': // atalho
            await helpCommand(sock, m, jid, args);
            break;
        case 'aluguel':
            await aluguelCommand(sock, m, jid, args, senderId);
            break;
        case 'geimage':
            await geimageCommand(sock, m, jid, args, PREFIX);
            break;
        case 'seticon':
            await seticonCommand(sock, m, jid);
            break;
        case 'ppt':
        case 'jokenpo': // atalho
            await pptCommand(sock, m, jid, args, senderId);
            break;
        case 'relacionamento': // O novo comando de ajuda
        case 'statusnamoro': // O novo comando de status
        case 'pedirnamoro':
        case 'aceitar':
        case 'recusar':
        case 'casar':
        case 'aceitarcasamento':
        case 'recusarcasamento':
        case 'terminar':
        case 'terminarnamoro': // O novo alias para terminar
        case 'divorcio':
        case 'casais':
            await relacionamentoCommand(sock, m, jid, args, senderId, comando);
            break;
        case 'clima':
            await climaCommand(sock, m, jid, args, PREFIX);
            break;
        case 'esportes':
           await esportesCommand(sock, m, jid);
           break;
        case 'moedas':
        case 'moeda': // atalho
            await moedasCommand(sock, m, jid);
            break;
        case 'tiktok':
            await tiktokCommand(sock, m, jid, args, PREFIX, API_KEY);
            break;
        case 'antilink':
            await antilinkCommand(sock, m, jid, args);
            break;
        case 'd':
            await dCommand(sock, m, jid);
            break;
        case 'quiz':
            await startQuiz(sock, m, jid);
            break;
        case 'desenhar':
        case 'iaimagem': // atalho
            await desenharCommand(sock, m, jid, args, PREFIX);
            break;
        case 'testbtn':
            await testbtnCommand(sock, m, jid);
            break;
        case 'antipv':
            await antipvCommand(sock, m, jid, args, senderId);
            break;
        case 'correio':
            await correioCommand(sock, m, jid, args, PREFIX);
            break;
        case 'img':
        case 'gimage': // atalho
            await imgCommand(sock, m, jid, args, PREFIX);
            break;

        // Comandos de XP/Economia/Social
        case 'ativarxp':
        case 'xpoptin':
            await gerenciarXpCommand(sock, m, jid, senderId, 'ativar');
            break;
        case 'desativarxp':
        case 'xpoptout':
            await gerenciarXpCommand(sock, m, jid, senderId, 'desativar');
            break;
        case 'perfil':
    // Garanta que 'startTime' está sendo passado aqui
    await perfilCommand(sock, m, jid, args, senderId, startTime);
    break;
        case 'loja':
            await lojaCommand(sock, m, jid);
            break;
        case 'comprar':
            await comprarCommand(sock, m, jid, args);
            break;
        case 'daily':
            await dailyCommand(sock, m, jid);
            break;
        case 'rank':
            await rankCommand(sock, m, jid, args);
            break;
        case 'pedirnamoro':
            await pedirnamoroCommand(sock, m, jid, args);
            break;

        // Comandos de Jogos
        case 'velha':
    // Adicionamos 'gameStates' para que o comando possa acessá-lo
    await velhaCommand(sock, m, jid, args, gameStates, PREFIX);
    break;
        case 'brincadeiras':
            await brincadeirasCommand(sock, m, jid, args);
            break;
        case 'sorteio':
            await sorteioCommand(sock, m, jid, args);
            break;

        // Comandos de Mídia/Downloads
        case 'facebook':
        case 'fb':
            await facebookCommand(sock, m, jid, args, PREFIX, API_KEY);
            break;
        case 'play':
        case 'p':
            await playCommand(sock, m, jid, args, userStates);
            break;
        case 'ytmp4':
            await ytmp4Command(sock, m, jid, args);
            break;
        case 'pix':
            await pixCommand(sock, m, jid, args, senderId);
            break;
        case 'instagram':
            await instagramCommand(sock, m, jid, args);
            break;
        // case 'tiktok': // Opcional, se quiser readicionar o simples
        //     await tiktokCommand(sock, m, jid, args, PREFIX, API_KEY);
        //     break;

        // Comandos de Figurinhas
        case 'figu':
        case 's':
            await figuCommand(sock, m, jid);
            break;
        case 'toimg':
            await toimgCommand(sock, m, jid);
            break;
            
        // Comandos de Grupo (Admin)
        case 'add':
            await addCommand(sock, m, jid, args);
            break;
        case 'ban':
            await banCommand(sock, m, jid, args);
            break;
        case 'demote':
            await demoteCommand(sock, m, jid, args);
            break;
        case 'promover':
            await promoverCommand(sock, m, jid, args);
            break;
        case 'marcarall':
        
            await marcarallCommand(sock, m, jid, args, PREFIX);
            break;
        case 'mute':
        case 'unmute':
            await muteCommand(sock, m, jid, args, comando);
            break;
        case 'fechar':
        case 'abrir':
            await grupoCommand(sock, m, jid, comando);
            break;
        case 'soadms':
            await soadmsCommand(sock, m, jid, args);
            break;
        case 'welcome':
            await welcomeCommand(sock, m, jid, args);
            break;
        case 'setwelcome':
            await setwelcomeCommand(sock, m, jid, args);
            break;
        case 'x9':
            await x9Command(sock, m, jid, args);
            break;
        case 'groupstats':
            await groupstatsCommand(sock, m, jid, args, PREFIX);
            break;
        case 'banall':
            await banallCommand(sock, m, jid, args, PREFIX);
            break;
        case 'limpar':
            await limparCommand(sock, m, jid, args);
            break;

        // Comandos de Utilidade Geral
        case 'menu':
            await menuCommand(sock, m, jid, PREFIX, startTime);
            break;
        case 'ping':
        case 'bot':
            await pingCommand(sock, m, jid, startTime);
            break;
        case 'gemini':
            await geminiCommand(sock, m, jid, args, API_KEY);
            break;
        case 'signo':
            await signoCommand(sock, m, jid, args, API_KEY);
            break;
        case 'attp':
        case 'attp2':
            await attpCommand(sock, m, jid, args, API_KEY, comando);
            break;
        case 'rename':
            await renameCommand(sock, m, jid, args, PREFIX);
            break;
        case 'reverse':
            await reverseCommand(sock, m, jid);
            break;
        case 'audio':
            await audioCommand(sock, m, jid, args);
            break;
        case 'transcrever':
            await transcreverCommand(sock, m, jid);
            break;
        case 'bug':
        case 'sugestao':
            await bugCommand(sock, m, jid, args);
            break;
        case 'mygroups':
            await mygroupsCommand(sock, m, jid, args, senderId);
            break;
        case 'imgpralink':
            await imgpralinkCommand(sock, m, jid);
            break;
        case 'qrcode':
            await qrcodeCommand(sock, m, jid, args, PREFIX);
            break;
        case 'print':
            await printCommand(sock, m, jid, args, PREFIX);
            break;
        case 'testbtn':
            await testbtnCommand(sock, m, jid);
            break;
            
        default:
            await sock.sendMessage(jid, { text: `❌ Comando não reconhecido. Digite ${PREFIX}menu para ver a lista de comandos.` }, { quoted: m });
    }
};