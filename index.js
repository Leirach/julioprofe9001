var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var replies = require('./memes/reply.json');
var utilities = require('./utilities');
var copypastas

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

    copypastas = utilities.loadCopypastas();
});

//reply to messages
bot.on('message', function (user, userID, channelID, message, evt) {
    if (message.charAt(0) === '!'){
        command = message.substring(1);
        handle(command, channelID);
    }
    else {
        reply(message, channelID);
    }
});

function reply(message, channelID) {
    var words = message.split(" ");
        words.forEach(word => {
            let answer = replies.memes[word];
            if (answer) {
                bot.sendMessage({
                    to: channelID,
                    message: answer
                });
            }
        });
}

function handle(command, channelID) {
    var answer
    switch(command) {
        case 'copypasta':
            answer = utilities.getRandom(copypastas);
            break;
        case 'oraculo':
            answer = utilities.getRandom(replies.oraculo);
            break;

    }
    if (answer) {
        bot.sendMessage({
            to: channelID,
            message: answer
        });
    }
}

/*
falta
!oraculo
!xd
!navyseals
!copypasta
*/