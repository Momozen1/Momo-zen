// ==================== commands/weather.js ====================
import axios from 'axios';

export default {
    name: 'meteo',
    alias: ['meteo', 'temp'],
    category: 'General',
    description: 'Affiche la météo actuelle pour une ville donnée',
    async execute(kaya, m, args) {
        const chatId = m.chat;
        const city = args.join(' ');

        if (!city) {
            return kaya.sendMessage(chatId, { text: '❌ Usage : .weather <city>\nExemple : .weather Paris' }, { quoted: m });
        }

        try {
            const apiKey = '4902c0f2550f58298ad4146a92b65e10'; // Remplace par ta clé OpenWeather
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
            );

            const weather = response.data;
            const weatherText = `
🌆 Météo pour : *${weather.name}, ${weather.sys.country}*
🌡 Température : *${weather.main.temp}°C*
☁ Conditions : *${weather.weather[0].description}*
💨 Vent : *${weather.wind.speed} m/s*
💧 Humidité : *${weather.main.humidity}%*
            `.trim();

            await kaya.sendMessage(chatId, { text: weatherText }, { quoted: m });
        } catch (err) {
            console.error('❌ weather command error:', err);
            await kaya.sendMessage(chatId, { text: '❌ Impossible de récupérer la météo. Vérifie le nom de la ville ou réessaie plus tard.' }, { quoted: m });
        }
    }
};