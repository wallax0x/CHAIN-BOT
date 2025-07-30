// commands/obesidade.js
const { PREFIX } = require('../config');

const command = async (sock, m, jid, args) => {
    try {
        const input = args[0];

        // 1. Validação da Entrada
        if (!input || !input.includes('/')) {
            const helpMsg = `⚖️ *Calculadora de IMC*\n\nPor favor, envie seu peso e altura no formato correto.\n\n*Exemplos:*\n\`${PREFIX}obesidade 70/1.75\` (altura em metros)\n\`${PREFIX}obesidade 85/180\` (altura em centímetros)`;
            return sock.sendMessage(jid, { text: helpMsg }, { quoted: m });
        }

        const [pesoStr, alturaStr] = input.split('/');
        let peso = parseFloat(pesoStr.replace(',', '.'));
        let altura = parseFloat(alturaStr.replace(',', '.'));

        if (isNaN(peso) || isNaN(altura) || peso <= 0 || altura <= 0) {
            return sock.sendMessage(jid, { text: '❌ Por favor, forneça valores numéricos válidos para peso e altura.' }, { quoted: m });
        }

        // 2. Normalização da Altura
        // Se a altura for maior que 3, assume-se que foi inserida em centímetros
        if (altura > 3) {
            altura = altura / 100; // Converte para metros
        }

        // 3. Cálculo do IMC
        const imc = peso / (altura * altura);

        // 4. Interpretação do Resultado
        let categoria = '';
        let emoji = '';
        if (imc < 18.5) {
            categoria = 'Abaixo do peso';
            emoji = '📉';
        } else if (imc >= 18.5 && imc <= 24.9) {
            categoria = 'Peso normal';
            emoji = '✅';
        } else if (imc >= 25 && imc <= 29.9) {
            categoria = 'Sobrepeso';
            emoji = '⚠️';
        } else if (imc >= 30 && imc <= 34.9) {
            categoria = 'Obesidade Grau I';
            emoji = '❗';
        } else if (imc >= 35 && imc <= 39.9) {
            categoria = 'Obesidade Grau II';
            emoji = '‼️';
        } else { // imc >= 40
            categoria = 'Obesidade Grau III (Mórbida)';
            emoji = '🚨';
        }

        // 5. Montagem da Mensagem de Resposta
        const responseMessage = `
⚖️ *Resultado do seu IMC* ⚖️

*Sua Altura:* ${altura.toFixed(2)} m
*Seu Peso:* ${peso.toFixed(1)} kg

*Seu IMC é:* *${imc.toFixed(2)}*

*Classificação:* ${emoji} *${categoria}*

_Lembre-se: este cálculo é apenas uma referência. Consulte um profissional de saúde para uma avaliação completa!_
        `.trim();

        await sock.sendMessage(jid, { text: responseMessage }, { quoted: m });

    } catch (e) {
        console.error('Erro no comando obesidade:', e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao calcular seu IMC.' }, { quoted: m });
    }
};

module.exports = command;