const { Telegraf, Markup } = require('telegraf')
const { message } = require('telegraf/filters')
const dotenv = require('dotenv');
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN)
let a = 0

// Функция для приветствия пользователя
const welcomeMessage = (ctx) => {
    const name = ctx.message.chat.first_name; // Получаем имя пользователя
    ctx.replyWithMarkdown(`👋 Привет, *${name}*!\n\nЭтот бот поможет тебе:\n*Узнать* расписание ближайших событий.\n*Записаться* на интересующие мероприятия.\n*Связаться* с администрацией Президента школы.`);
  };


const menu = (ctx) => {
ctx.reply(
    '📋 Выберите действие из меню:',
    Markup.inlineKeyboard([
    [Markup.button.callback('📅 Узнать расписание мероприятий', 'schedule')],
    [Markup.button.callback('📝 Записаться на мероприятия', 'register')],
    [Markup.button.callback('✉️ Отправить предложение или жалобу', 'feedback')],
    [Markup.button.callback('🏆 Посмотреть баллы "Лучший Класс"', 'scores')],
    ])
);
};
  
// Обработка команды /start
bot.start((ctx) => {
    welcomeMessage(ctx);
});

bot.command('menu', (ctx) => {
    menu(ctx);
});

bot.action('schedule', (ctx) => {
    ctx.reply('📅 Вот расписание ближайших мероприятий:\n\n(тут должен быть импорт из бд(бд не создавать до деплоя!!!))');
});

bot.action('register', (ctx) => {
    ctx.reply('📝 Чтобы записаться на мероприятия... (тут должен быть выбор мероприятия, потом вопрос лидер/участник и далее от этого)');
});

bot.action('feedback', (ctx) => {
    ctx.reply('✉️ Пожалуйста, напишите ваше предложение или жалобу, и мы свяжемся с вами в ближайшее время.');
});

bot.action('scores', (ctx) => {
    ctx.reply('🏆 Текущие баллы по конкурсу "Лучший Класс":\n\n(тут должен быть импорт из бд(бд не создавать до деплоя!!!))');
});

// Обработка текстовых сообщений "старт", "начать", "меню"
bot.hears(['старт', 'начать'], (ctx) => {
    welcomeMessage(ctx);
});

bot.hears(['меню'], (ctx) => {
    menu(ctx);
});

bot.on(message('sticker'), (ctx) => menu(ctx))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
