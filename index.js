import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';
import http from 'http';
import { commands } from './commands.js';

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

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
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
      GROQ_API_URL,
      {
        model: 'mixtral-8x7b-32768', // Надежная бесплатная модель Groq
        messages: [
          {
            role: 'system',
            content: 'Ты ИИ-помощник и опытный программист в Discord по имени Колин ИИ. Ты работаешь на основе искусственного интеллекта. Отвечай ТОЛЬКО на русском языке. Ты отлично разбираешься в программировании на всех языках (JavaScript, Python, C++, Java и др.). Помогаешь писать код, находить ошибки, объясняешь концепции. Когда пишешь код, используй markdown форматирование с ```язык. Будь дружелюбным и понятно объясняй сложные вещи.',
          },
          ...history,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiMessage = response.data.choices[0].message.content;
    
    // Добавляем ответ ИИ в историю
    history.push({ role: 'assistant', content: aiMessage });

    return aiMessage;
  } catch (error) {
    console.error('Ошибка при обращении к Groq API:', error.response?.data || error.message);
    
    // Обработка ошибок Groq API
    if (error.response?.status === 401) {
      return 'Ошибка авторизации Groq API. Проверь API ключ.';
    } else if (error.response?.status === 429) {
      return 'Превышен лимит запросов Groq. Попробуй позже.';
    } else if (error.response?.status === 400) {
      return 'Неверный запрос к Groq API.';
    }
    
    // Временные базовые ответы
    const basicResponses = [
      'Привет! Я Колин ИИ, временно работаю в базовом режиме.',
      'Здорово! Чем могу помочь? (Пока работаю без AI)',
      'Привет! Я здесь, но пока в упрощенном режиме.',
      'Йо! Колин на связи!'
    ];
    
    return basicResponses[Math.floor(Math.random() * basicResponses.length)];
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

  // Проверяем на ключевые слова новичка
  const messageContent = message.content.toLowerCase();
  const newbieKeywords = [
    'я новичок', 'новичек', 'новенький', 'только зашел', 'только присоединился',
    'первый раз здесь', 'что тут делать', 'как тут все устроено', 'расскажите про сервер',
    'что за сервер', 'новый участник', 'только что зашёл', 'только что присоединился'
  ];

  // Если найдены ключевые слова новичка, отправляем приветствие
  if (newbieKeywords.some(keyword => messageContent.includes(keyword))) {
    const welcomeMessage = `Да конечно расскажу про сервер! 
1. Много войсов 
2. Вы можете кинуть нам буст и мы ответим благодарностью!
3. Постоянно активные новости!
4. Я колин и Леха ИИ!
5. Иногда публикуем мемные видосчики)
6. Есть отзывы, вопроосы и просьбы!
7. Иногда вы можете получить сообщения от создателя!
8. Вообще сервер крутой надеюсь вам всем понравится! Мы рады новым участникам сервера❣️`;
    
    await message.reply(welcomeMessage);
    return;
  }

  // Проверяем, упомянут ли бот или есть префикс
  const isMentioned = message.mentions.has(client.user);
  const hasPrefix = message.content.startsWith(BOT_PREFIX);

  // Обработка команд
  if (hasPrefix) {
    const args = message.content.slice(BOT_PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    if (commands[commandName]) {
      try {
        await commands[commandName].execute(message, conversationHistory, args);
      } catch (error) {
        console.error('Ошибка при выполнении команды:', error);
        message.reply('❌ Произошла ошибка при выполнении команды!');
      }
      return;
    }
  }

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
