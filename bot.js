const { Telegraf, Markup } = require('telegraf');
const { message } = require('telegraf/filters');
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();
const uri = process.env.DB_TOKEN;

const userStates = {};

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function insertTeam(teamName, leaderName, leaderId) {
  try {
    await client.connect();
    const collection = client.db("TGBotDB").collection("teams");
    await collection.insertOne({
      teamName: teamName,
      leaderName: leaderName,
      leaderId: leaderId,
      members: [] 
    });
  } finally {
    await client.close();
  }
}

// Функция для проверки, является ли пользователь администратором
async function isAdmin(userId) {
  try {
    await client.connect();
    const adminsCollection = client.db("TGBotDB").collection("teams");
    let admin = await adminsCollection.findOne({ leaderId: userId });
    return !!admin; // Возвращает true, если администратор найден, иначе false
  } finally {
    await client.close();
  }
}

const bot = new Telegraf(process.env.BOT_TOKEN);

const welcomeMessage = (ctx) => {
  const name = ctx.message.chat.first_name; 
  ctx.replyWithMarkdown(`👋 Привет, *${name}*!\n\nЭтот бот поможет тебе:\n*Узнать* расписание ближайших событий.\n*Записаться* на интересующие мероприятия.\n*Связаться* с администрацией Президента школы.`);
};

const menu = async (ctx) => {
  const userId = ctx.from.id;
  const admin = await isAdmin(userId);
  const buttons = [
    [Markup.button.callback('📅 Узнать расписание мероприятий', 'schedule')],
    [Markup.button.callback('📝 Записаться на мероприятия', 'register')],
    [Markup.button.callback('✉️ Отправить предложение или жалобу', 'feedback')],
    [Markup.button.callback('🏆 Посмотреть баллы "Лучший Класс"', 'scores')],
  ];
  if (admin) {
    buttons.push([Markup.button.callback('⚙️ Админ Панель', 'admin')]);
  }
  ctx.reply('📋 Выберите действие из меню:', Markup.inlineKeyboard(buttons));
};

bot.start((ctx) => {
  waitingForTeamName = false;
  welcomeMessage(ctx);
});

bot.command('menu', (ctx) => {
  waitingForTeamName = false;
  menu(ctx);
});

bot.action('schedule', (ctx) => {
  waitingForTeamName = false;
  ctx.reply('📅 Вот расписание ближайших мероприятий:\n\n(тут должен быть импорт из бд(бд не создавать до деплоя!!!))');
});

bot.action('register', (ctx) => {
  waitingForTeamName = false;
  ctx.reply('📝 Выберите Вашу роль в команде: участник или лидер.', Markup.inlineKeyboard([
    [Markup.button.callback('Я участник', 'member')],
    [Markup.button.callback('Я лидер', 'lider')],
    [Markup.button.callback('Назад в меню', 'menu')]
  ]));
});

bot.action('member', (ctx) => {
  waitingForTeamName = false;
  ctx.reply('///');
});

bot.action('lider', async (ctx) => {
    const userId = ctx.from.id;
    const admin = await isAdmin(userId);
    if(admin) {
        ctx.reply('Извините, но Вы не можете быть лидером нескольких команд. Старую команду можно удалить через меню. \n\n (/menu -> Лидер Панель -> Удалить команду)');
    } else {
    userStates[userId] = { waitingForTeamName: true };
    ctx.reply('Отлично! Тогда напишите название вашей команды. После этого Вы автоматически будете добавлены в участники команды, так что никаких дополнительных действий не требуется.');
    waitingForTeamName = true;
    }
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;

  if (userStates[userId] && userStates[userId].waitingForTeamName) {
    const teamName = ctx.message.text;
    userStates[userId].waitingForTeamName = false;
    
    const leaderName = ctx.message.from.first_name;
    const leaderId = ctx.message.from.id;

    await insertTeam(teamName, leaderName, leaderId);

    ctx.reply(`Вы успешно добавлены в команду "${teamName}"! Редактирование команды доступно из меню.`);
  }
});

bot.action('feedback', (ctx) => {
  ctx.reply('✉️ Пожалуйста, напишите ваше предложение или жалобу, и мы свяжемся с вами в ближайшее время.');
});

bot.action('scores', (ctx) => {
  ctx.reply('🏆 Текущие баллы по конкурсу "Лучший Класс":\n\n(тут должен быть импорт из бд(бд не создавать до деплоя!!!))');
});

bot.action('admin', (ctx) => {
  ctx.reply('⚙️ Лидер Панель: Здесь будут административные функции.');
});

bot.hears(['старт', 'начать'], (ctx) => {
  welcomeMessage(ctx);
});

bot.hears(['меню'], (ctx) => {
  menu(ctx);
});

bot.on(message('sticker'), (ctx) => menu(ctx));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
