const goodMorningMessages = [
    "🌞 Bom dia! Acordar cedo é um treino diário de superação... força aí! 😂",
    "☕ Bom dia! Se o café não resolver, tenta um milagre… 😅",
    "Bom dia! A preguiça até tentou, mas hoje você venceu... por enquanto! 😴👉💪",
    "Acorda, porque ficar rico dormindo ainda não é uma opção! 💸😂",
    "Bom dia! Hoje é aquele dia lindo pra fingir que estamos animados! 😎"
];

const goodAfternoonMessages = [
    "Boa tarde! Se a manhã foi ruim… relaxa, a tarde também promete! 😂",
    "🌇 Boa tarde! Lembre-se: desistir não é opção... pelo menos até amanhã! 😅",
    "Metade do dia já foi… agora é só sobreviver até o final! 💪🤡",
    "Boa tarde! Respira fundo… e finge que tá tudo sob controle! 😎",
    "🥱 Boa tarde! Força… já já é hora de ir pra casa reclamar de cansaço! 😂"
];

const goodNightMessages = [
    "Boa noite! Hora de deitar… e ficar rolando no celular por mais 2 horas! 📱😂",
    "🌙 Boa noite! Que os boletos te deem uma trégua nos sonhos! 😴💸",
    "😌 Hora de dormir… ou de ficar pensando em decisões ruins da vida! 😂",
    "Boa noite! Amanhã tem mais… mais sono, mais correria e mais café! ☕🔥",
    "⭐ Boa noite! Descanse… porque amanhã o despertador não vai ter dó de você! ⏰😅"
];

const helloMessages = [
    "👋 Opa! Cheguei igual cobrança de cartão… do nada! 😂",
    "Oi! Sumi mas voltei… igual conta atrasada! 💸😅",
    "Olááá! Achei que você merecia essa visita inesperada… de novo! 🤪",
    "E aí! Tudo em ordem… ou tá igual minha vida? 😂",
    "👀 Passei só pra lembrar que tô de olho… brincadeira… ou não! 😎"
];

function getRandomGoodMorning() {
    return goodMorningMessages[Math.floor(Math.random() * goodMorningMessages.length)];
}

function getRandomGoodAfternoon() {
    return goodAfternoonMessages[Math.floor(Math.random() * goodAfternoonMessages.length)];
}

function getRandomGoodNight() {
    return goodNightMessages[Math.floor(Math.random() * goodNightMessages.length)];
}

function getRandomHello() {
    return helloMessages[Math.floor(Math.random() * helloMessages.length)];
}

module.exports = {
    getRandomGoodMorning,
    getRandomGoodAfternoon,
    getRandomGoodNight,
    getRandomHello
};
