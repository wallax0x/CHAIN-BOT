// listeners/presence.update.js (Versão de Diagnóstico Final)

const deviceCache = new Map();

const handlePresenceUpdate = async (update) => {
    // LOG DE DIAGNÓSTICO: Este é o log mais importante.
    // Ele nos dirá se o bot está recebendo QUALQUER coisa do evento de presença.
    console.log('[Presence-Debug] Evento de presença recebido:', JSON.stringify(update, null, 2));

    try {
        const { id, presences } = update;
        for (const userId in presences) {
            const presenceData = presences[userId];
            if (presenceData.platform) {
                console.log(`[Presence] Dispositivo de ${userId} registrado como: ${presenceData.platform}`);
                deviceCache.set(userId, presenceData.platform);
            }
        }
    } catch (e) {
        console.error("Erro no listener de presença:", e);
    }
};

module.exports = {
    handlePresenceUpdate,
    deviceCache
};