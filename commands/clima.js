// commands/clima.js
const axios = require('axios');
const { WEATHER_API_KEY } = require('../config'); // Pega a nova chave do config

const command = async (sock, m, jid, args, PREFIX) => {
    try {
        const city = args.join(' ');
        if (!city) {
            return sock.sendMessage(jid, { text: `❓ Por favor, informe o nome de uma cidade.\n\nExemplo: \`${PREFIX}clima Rio de Janeiro\`` }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `☁️ Buscando previsão do tempo para "${city}"...` }, { quoted: m });

        // --- MUDANÇA: URL da API do WeatherAPI.com ---
        const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&lang=pt`;

        const response = await axios.get(apiUrl);
        const weatherData = response.data;
        
        // --- MUDANÇA: Extração dos dados da nova API ---
        const locationName = `${weatherData.location.name}, ${weatherData.location.region}`;
        const condition = weatherData.current.condition.text;
        const temp = weatherData.current.temp_c;
        const feels_like = weatherData.current.feelslike_c;
        const humidity = weatherData.current.humidity;
        const wind_speed = weatherData.current.wind_kph;
        const iconUrl = "https:" + weatherData.current.condition.icon; // Pega o ícone do tempo

        const weatherMessage = `
⛅ *PREVISÃO DO TEMPO PARA ${locationName.toUpperCase()}*

*Condição:* ${condition}
🌡️ *Temperatura Atual:* ${temp}°C
🥵 *Sensação Térmica:* ${feels_like}°C
💧 *Umidade:* ${humidity}%
💨 *Vento:* ${wind_speed} km/h
        `.trim();

        // Envia a mensagem com uma imagem do ícone do tempo
        await sock.sendMessage(jid, { 
            image: { url: iconUrl },
            caption: weatherMessage 
        }, { quoted: m });

    } catch (e) {
        // O erro de "cidade não encontrada" nesta API geralmente é um erro 400
        if (e.response && e.response.status === 400) {
            return sock.sendMessage(jid, { text: `❌ Cidade não encontrada. Verifique o nome e tente novamente.` }, { quoted: m });
        }
        if (e.response && e.response.status === 401) {
            return sock.sendMessage(jid, { text: `❌ Chave de API inválida. Verifique o config.js.` }, { quoted: m });
        }
        console.error("Erro no comando clima:", e);
        await sock.sendMessage(jid, { text: '❌ Ocorreu um erro ao buscar a previsão do tempo.' }, { quoted: m });
    }
};

module.exports = command;