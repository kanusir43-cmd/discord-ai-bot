# Discord AI Bot 🤖

Discord бот с искусственным интеллектом через OpenRouter API.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Получение токенов

#### Discord Bot Token:
1. Перейди на https://discord.com/developers/applications
2. Нажми "New Application" и дай имя боту
3. Перейди в раздел "Bot" → "Reset Token" → скопируй токен
4. Включи "MESSAGE CONTENT INTENT" в настройках бота
5. Перейди в "OAuth2" → "URL Generator"
   - Выбери scope: `bot`
   - Выбери permissions: `Send Messages`, `Read Messages/View Channels`, `Read Message History`
6. Скопируй ссылку и добавь бота на свой сервер

#### OpenRouter API Key:
1. Перейди на https://openrouter.ai/
2. Зарегистрируйся (бесплатно)
3. Перейди на https://openrouter.ai/keys
4. Создай новый API ключ

### 3. Настройка

Скопируй `.env.example` в `.env`:

```bash
copy .env.example .env
```

Заполни `.env` своими токенами:

```env
DISCORD_TOKEN=твой_discord_токен
OPENROUTER_API_KEY=твой_openrouter_ключ
```

### 4. Запуск

```bash
npm start
```

## 💬 Как использовать

Бот отвечает на сообщения двумя способами:

1. **Упоминание**: `@БотИмя привет, как дела?`
2. **Префикс**: `!привет, как дела?`

Бот запоминает последние 10 сообщений в каждом канале для контекста разговора.

## ⚙️ Настройки

В файле `index.js` можно изменить:

- `BOT_PREFIX` - префикс для команд (по умолчанию `!`)
- `model` - модель ИИ (по умолчанию `meta-llama/llama-3.2-3b-instruct:free`)
- Системный промпт в функции `getAIResponse`

В `.env` можно добавить:

- `CHANNEL_ID` - ID канала, где бот будет работать (если не указан, работает везде)

## 📝 Доступные бесплатные модели на OpenRouter

- `meta-llama/llama-3.2-3b-instruct:free`
- `meta-llama/llama-3.2-1b-instruct:free`
- `google/gemma-2-9b-it:free`

Полный список: https://openrouter.ai/models?order=newest&supported_parameters=tools&max_price=0

## 🛠️ Требования

- Node.js 18 или выше
- npm или yarn

## 📦 Зависимости

- `discord.js` - библиотека для Discord API
- `axios` - HTTP клиент для запросов к OpenRouter
- `dotenv` - загрузка переменных окружения

## ❗ Важно

- Не публикуй файл `.env` с токенами!
- Файл `.env` уже добавлен в `.gitignore`
- Бесплатные модели OpenRouter имеют лимиты на количество запросов

## 🐛 Решение проблем

**Бот не отвечает:**
- Проверь, что включен "MESSAGE CONTENT INTENT" в настройках бота на Discord
- Убедись, что токены правильно указаны в `.env`

**Ошибка API:**
- Проверь, что API ключ OpenRouter действителен
- Убедись, что не превышен лимит бесплатных запросов

**Бот офлайн:**
- Проверь консоль на наличие ошибок
- Убедись, что Discord токен правильный
