// utils/rental_checker.js

const fs = require('fs').promises;
const path = require('path');

const RENTALS_PATH = path.resolve(__dirname, '../json/rentals.json');

async function readRentals() {
    try {
        const data = await fs.readFile(RENTALS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (e) { return {}; }
}

async function writeRentals(data) {
    await fs.writeFile(RENTALS_PATH, JSON.stringify(data, null, 2));
}

// A função que verifica os aluguéis
async function checkExpiredRentals(sock) {
    console.log('[RentalChecker] Verificando aluguéis expirados...');
    const rentals = await readRentals();
    const now = Date.now();
    let updated = false;

    for (const groupId in rentals) {
        if (now > rentals[groupId].expirationTimestamp) {
            console.log(`[RentalChecker] Aluguel do grupo ${groupId} expirou. Enviando aviso e saindo...`);
            try {
                // Envia a mensagem de despedida
                await sock.sendMessage(groupId, { text: '👋 O tempo de aluguel deste bot no grupo expirou. Para renovar, fale com meu proprietário. Saindo...' });
                // Sai do grupo
                await sock.groupLeave(groupId);
                
                // Remove do registro
                delete rentals[groupId];
                updated = true;

            } catch (e) {
                console.error(`[RentalChecker] Falha ao sair do grupo ${groupId}:`, e);
                // Se falhar (ex: não é mais membro), apenas remove do registro
                delete rentals[groupId];
                updated = true;
            }
        }
    }

    if (updated) {
        await writeRentals(rentals);
    }
}

// Inicia o verificador para rodar a cada hora
function startRentalChecker(sock) {
    console.log('✅ Verificador de Aluguéis iniciado. Checando a cada hora.');
    // Roda a verificação uma vez no início
    checkExpiredRentals(sock);
    // E depois define para rodar a cada hora (3600000 milissegundos)
    setInterval(() => checkExpiredRentals(sock), 3600000);
}

module.exports = { startRentalChecker, readRentals, writeRentals };