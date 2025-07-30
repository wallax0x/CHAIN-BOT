// iniciar.js

const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    Browsers
} = require('@whiskeysockets/baileys');

const P = require('pino');
const { PREFIX, API_KEY, GEMINI_API_KEY } = require('./config'); // Adicionado GEMINI_API_KEY para consistência
const delay = require('./utils/delay');

// Listeners e Handlers
const connectionUpdateListener = require('./listeners/connectionUpdate');
const messagesUpsertListener = require('./listeners/messagesUpsert');
const groupParticipantsUpdateListener = require('./listeners/groupParticipantsUpdate');
const muteFilter = require('./middleware/muteFilter');
const handleCommand = require('./commandHandler/handleCommand');
const { startRentalChecker } = require('./utils/rental_checker');
const { setSock } = require('./utils/bot_instance');
const { handlePresenceUpdate } = require('./listeners/presence.update.js');
const { resetAllStats } = require('./utils/stats_manager.js'); // Ajuste o caminho se necessário

// Variáveis de Estado Globais
const userStates = {};
const startTime = Date.now();
const gameStates = {}; 
const commandTimestamps = {};

// --- AGENDADOR DE TAREFAS DIÁRIAS (VERSÃO NATIVA) ---
function scheduleDailyReset() {
    const now = new Date();
    const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // Pega o dia de amanhã
        0, 0, 0 // Seta para 00:00:00
    );

    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    console.log(`[AGENDADOR-NATIVO] Reset diário do ranking agendado para daqui a ${(msUntilMidnight / 1000 / 60 / 60).toFixed(2)} horas.`);

    setTimeout(() => {
        console.log('[AGENDADOR-NATIVO] Executando a tarefa de reset diário do ranking de atividade.');
        resetAllStats();
        scheduleDailyReset(); // Reagenda a tarefa para o próximo dia
    }, msUntilMidnight);
}

// Inicia o agendador quando o bot liga
scheduleDailyReset();

async function iniciar() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            logger: P({ level: 'silent' }),
            printQRInTerminal: true,
            browser: Browsers.macOS('Desktop'),
            auth: state,
            version
        });

        setSock(sock);
        sock.ev.on('creds.update', saveCreds);
        startRentalChecker(sock);

        sock.ev.on('connection.update', (update) => connectionUpdateListener(sock, update, iniciar));
        sock.ev.on('presence.update', (update) => handlePresenceUpdate(update));

        sock.ev.on('messages.upsert', (data) => messagesUpsertListener(
            sock, 
            data, 
            muteFilter,
            handleCommand,
            PREFIX,
            API_KEY,
            GEMINI_API_KEY, // Passando a chave do Gemini
            userStates,
            startTime,
            gameStates,
            commandTimestamps
        ));

        sock.ev.on('group-participants.update', (data) => groupParticipantsUpdateListener(sock, data));

        return sock;
    } catch (error) {
        console.error('Erro ao iniciar o bot:', error);
    }
}

iniciar();
