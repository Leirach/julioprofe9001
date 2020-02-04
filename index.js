var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var reply = require('./reply.json');

//logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

//init bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

//connect
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

//reply to messages
bot.on('message', function (user, userID, channelID, message, evt) {
    answer = reply[message];
    if (message) {
        bot.sendMessage({
            to: channelID,
            message: reply[message]
        });
    }

});

/*
falta
!oraculo
!xd
!navyseals
!copypasta
*/