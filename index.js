import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// HTTP сервер для health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const BOT_PREFIX = '!'; // Префикс для команд (можно изменить)

// История сообщений для контекста (последние 20 сообщений на канал для лучшего контекста)
const conversationHistory = new Map();

async function getAIResponse(userMessage, channelId) {
  try {
    // Получаем историю для этого канала
    if (!conversationHistory.has(channelId)) {
      conversationHistory.set(channelId, []);
    }
    const history = conversationHistory.get(channelId);

    // Добавляем сообщение пользователя
    history.push({ role: 'user', content: userMessage });

    // Ограничиваем историю последними 20 сообщениями
    if (history.length > 20) {
      history.shift();
    }

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'openai/gpt-3.5-turbo', // Более стабильная модель с хорошим русским
        messages: [
          {
            role: 'system',
            content: 'Ты ИИ-помощник и опытный программист в Discord по имени Колин ИИ. Ты работаешь на основе искусственного интеллекта. Отвечай ТОЛЬКО на русском языке. Ты отлично разбираешься в программировании на всех языках (JavaScript, Python, C++, Java и др.). Помогаешь писать код, находить ошибки, объясняешь концепции. Когда пишешь код, используй markdown форматирование с ```язык. Будь дружелюбным и понятно объясняй сложные вещи.',
          },
          ...history,
        ],
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiMessage = response.data.choices[0].message.content;
    
    // Добавляем ответ ИИ в историю
    history.push({ role: 'assistant', content: aiMessage });

    return aiMessage;
  } catch (error) {
    console.error('Ошибка при обращении к OpenRouter:', error.response?.data || error.message);
    return 'Извини, произошла ошибка при обработке твоего запроса. Проверь API ключ и попробуй снова.';
  }
}

client.on('ready', () => {
  console.log(`✅ Бот запущен как ${client.user.tag}`);
  console.log(`🤖 Готов к работе!`);
});

client.on('messageCreate', async (message) => {
  // Игнорируем сообщения от ботов
  if (message.author.bot) return;

  // Если указан конкретный канал, работаем только в нем
  if (process.env.CHANNEL_ID && message.channel.id !== process.env.CHANNEL_ID) {
    return;
  }

  // Проверяем, упомянут ли бот или есть префикс
  const isMentioned = message.mentions.has(client.user);
  const hasPrefix = message.content.startsWith(BOT_PREFIX);

  if (!isMentioned && !hasPrefix) return;

  // Убираем префикс или упоминание из сообщения
  let userMessage = message.content;
  if (hasPrefix) {
    userMessage = userMessage.slice(BOT_PREFIX.length).trim();
  } else if (isMentioned) {
    userMessage = userMessage.replace(`<@${client.user.id}>`, '').trim();
  }

  if (!userMessage) {
    message.reply('Привет! Чем могу помочь?');
    return;
  }

  // Показываем, что бот печатает
  await message.channel.sendTyping();

  try {
    const aiResponse = await getAIResponse(userMessage, message.channel.id);
    
    // Разбиваем длинные сообщения (Discord лимит 2000 символов)
    if (aiResponse.length > 2000) {
      const chunks = aiResponse.match(/[\s\S]{1,2000}/g);
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } else {
      await message.reply(aiResponse);
    }
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    message.reply('Произошла ошибка при обработке сообщения.');
  }
});

// Обработка ошибок
client.on('error', (error) => {
  console.error('Ошибка Discord клиента:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Необработанная ошибка:', error);
});

// Запуск бота
client.login(process.env.DISCORD_TOKEN);
