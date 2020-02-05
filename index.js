var Discord = require('discord.io');
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
exports.bot = new Discord.Client({
   token: auth.token,
   autorun: true
});


bot_js.init();
