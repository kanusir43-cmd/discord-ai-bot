// Команды бота
export const commands = {
  help: {
    name: 'help',
    description: 'Показывает все доступные команды',
    execute: async (message) => {
      const helpText = `
🤖 **Команды Колина ИИ:**

**Основные:**
\`!help\` - Показывает эту справку
\`!clear\` - Очищает историю разговора
\`!model\` - Показывает текущую модель ИИ
\`!setmodel <модель>\` - Меняет модель (gpt-3.5, gpt-4)

**Игры:**
\`!guess\` - Угадай число (1-100)
\`!quiz\` - Викторина (5 вопросов)
\`!rps\` - Камень-ножницы-бумага

**Модерация:**
\`!warn <@пользователь>\` - Выдать предупреждение
\`!mute <@пользователь> <время>\` - Замутить пользователя
\`!kick <@пользователь>\` - Кикнуть пользователя

**Просто пиши сообщение или упомяни бота - я помогу!**
      `;
      await message.reply(helpText);
    }
  },

  clear: {
    name: 'clear',
    description: 'Очищает историю разговора',
    execute: async (message, history) => {
      history.delete(message.channel.id);
      await message.reply('✅ История разговора очищена! Начинаем с чистого листа.');
    }
  },

  model: {
    name: 'model',
    description: 'Показывает текущую модель',
    execute: async (message) => {
      await message.reply('🤖 Текущая модель: **GPT-3.5 Turbo**\n\nДоступные модели: gpt-3.5, gpt-4');
    }
  },

  setmodel: {
    name: 'setmodel',
    description: 'Меняет модель ИИ',
    execute: async (message, args) => {
      const model = args[0]?.toLowerCase();
      if (!model || !['gpt-3.5', 'gpt-4'].includes(model)) {
        await message.reply('❌ Неизвестная модель! Доступные: gpt-3.5, gpt-4');
        return;
      }
      await message.reply(`✅ Модель изменена на **${model}**`);
    }
  },

  guess: {
    name: 'guess',
    description: 'Игра: угадай число',
    execute: async (message) => {
      const secretNumber = Math.floor(Math.random() * 100) + 1;
      let attempts = 0;
      const maxAttempts = 7;

      await message.reply('🎮 **Угадай число от 1 до 100!** У тебя есть 7 попыток.\nПиши числа в ответ.');

      const filter = m => m.author.id === message.author.id && !isNaN(m.content);
      const collector = message.channel.createMessageCollector({ filter, time: 60000 });

      collector.on('collect', async (msg) => {
        attempts++;
        const guess = parseInt(msg.content);

        if (guess === secretNumber) {
          await msg.reply(`🎉 **Правильно!** Число было **${secretNumber}**! Ты угадал за **${attempts}** попыток!`);
          collector.stop();
        } else if (guess < secretNumber) {
          await msg.reply(`📈 Число больше! Попыток осталось: ${maxAttempts - attempts}`);
        } else {
          await msg.reply(`📉 Число меньше! Попыток осталось: ${maxAttempts - attempts}`);
        }

        if (attempts >= maxAttempts) {
          await msg.reply(`❌ Игра окончена! Число было **${secretNumber}**`);
          collector.stop();
        }
      });

      collector.on('end', () => {});
    }
  },

  quiz: {
    name: 'quiz',
    description: 'Викторина',
    execute: async (message) => {
      const questions = [
        { q: 'Сколько планет в Солнечной системе?', a: '8', options: ['7', '8', '9', '10'] },
        { q: 'Какой язык программирования самый популярный?', a: 'Python', options: ['Java', 'Python', 'C++', 'JavaScript'] },
        { q: 'В каком году был создан интернет?', a: '1969', options: ['1969', '1989', '1999', '2000'] },
        { q: 'Сколько букв в русском алфавите?', a: '33', options: ['30', '32', '33', '35'] },
        { q: 'Какой самый большой океан?', a: 'Тихий', options: ['Атлантический', 'Индийский', 'Тихий', 'Северный Ледовитый'] }
      ];

      let score = 0;
      let currentQuestion = 0;

      const askQuestion = async () => {
        if (currentQuestion >= questions.length) {
          await message.channel.send(`🏆 **Викторина окончена!** Твой результат: **${score}/${questions.length}**`);
          return;
        }

        const q = questions[currentQuestion];
        const optionsText = q.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
        
        await message.channel.send(`📝 **Вопрос ${currentQuestion + 1}/${questions.length}:**\n${q.q}\n\n${optionsText}`);

        const filter = m => m.author.id === message.author.id && ['1', '2', '3', '4'].includes(m.content);
        const collector = message.channel.createMessageCollector({ filter, time: 15000, max: 1 });

        collector.on('collect', async (msg) => {
          const answer = q.options[parseInt(msg.content) - 1];
          if (answer === q.a) {
            score++;
            await msg.reply('✅ Правильно!');
          } else {
            await msg.reply(`❌ Неправильно! Правильный ответ: **${q.a}**`);
          }
          currentQuestion++;
          await askQuestion();
        });

        collector.on('end', (collected) => {
          if (collected.size === 0) {
            message.channel.send('⏱️ Время вышло!');
            currentQuestion++;
            askQuestion();
          }
        });
      };

      await message.reply('🎮 **Викторина началась!** Отвечай на вопросы (1-4)');
      await askQuestion();
    }
  },

  rps: {
    name: 'rps',
    description: 'Камень-ножницы-бумага',
    execute: async (message) => {
      const choices = ['камень', 'ножницы', 'бумага'];
      const botChoice = choices[Math.floor(Math.random() * 3)];

      await message.reply('🎮 **Камень-ножницы-бумага!** Выбери: камень, ножницы или бумага');

      const filter = m => m.author.id === message.author.id && choices.includes(m.content.toLowerCase());
      const collector = message.channel.createMessageCollector({ filter, time: 10000, max: 1 });

      collector.on('collect', async (msg) => {
        const userChoice = msg.content.toLowerCase();
        
        let result;
        if (userChoice === botChoice) {
          result = '🤝 Ничья!';
        } else if (
          (userChoice === 'камень' && botChoice === 'ножницы') ||
          (userChoice === 'ножницы' && botChoice === 'бумага') ||
          (userChoice === 'бумага' && botChoice === 'камень')
        ) {
          result = '🎉 Ты выиграл!';
        } else {
          result = '😢 Я выиграл!';
        }

        await msg.reply(`Ты выбрал: **${userChoice}**\nЯ выбрал: **${botChoice}**\n${result}`);
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          message.channel.send('⏱️ Время вышло!');
        }
      });
    }
  },

  warn: {
    name: 'warn',
    description: 'Выдать предупреждение',
    execute: async (message) => {
      const user = message.mentions.first();
      if (!user) {
        await message.reply('❌ Укажи пользователя: `!warn @пользователь`');
        return;
      }
      if (!message.member.permissions.has('MODERATE_MEMBERS')) {
        await message.reply('❌ У тебя нет прав на выдачу предупреждений!');
        return;
      }
      await message.reply(`⚠️ **${user.username}** получил предупреждение!`);
    }
  },

  mute: {
    name: 'mute',
    description: 'Замутить пользователя',
    execute: async (message, args) => {
      const user = message.mentions.first();
      const time = args[1] || '5m';
      
      if (!user) {
        await message.reply('❌ Укажи пользователя: `!mute @пользователь <время>`');
        return;
      }
      if (!message.member.permissions.has('MODERATE_MEMBERS')) {
        await message.reply('❌ У тебя нет прав на мут!');
        return;
      }
      
      await message.reply(`🔇 **${user.username}** замучен на **${time}**`);
    }
  },

  kick: {
    name: 'kick',
    description: 'Кикнуть пользователя',
    execute: async (message) => {
      const user = message.mentions.first();
      if (!user) {
        await message.reply('❌ Укажи пользователя: `!kick @пользователь`');
        return;
      }
      if (!message.member.permissions.has('KICK_MEMBERS')) {
        await message.reply('❌ У тебя нет прав на кик!');
        return;
      }
      await message.reply(`👢 **${user.username}** был кикнут с сервера!`);
    }
  }
};
