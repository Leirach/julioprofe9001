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

bot_js.init(bot);
