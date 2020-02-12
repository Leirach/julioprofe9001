var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var bot_js = require('./bot');

//logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

//init bot
bot = new Discord.Client();
bot.login(auth.token);

bot.on('ready', (evt) => {
    logger.info('Connected');
    logger.info(bot.user.username + ' - (' + bot.user.id + ')');
});

bot.on('message', (discord_message) => {
    bot_js.replyTo(discord_message);
});
