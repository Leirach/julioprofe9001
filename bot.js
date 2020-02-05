var Discord = require('discord.io');
var logger = require('winston');
var index = require('./index.js');
var replies = require('./memes/reply.json');
var utilities = require('./utilities');
var copypastas = utilities.loadCopypastas();

//connect bot
exports.init = function() {
    bot = index.bot;
    
    bot.on('ready', function (evt) {
        logger.info('Connected');
        logger.info('Logged in as: ');
        logger.info(bot.username + ' - (' + bot.id + ')');
    });
    
    //reply to messages
    bot.on('message', function (username, userID, channelID, message, evt) {
        if(username != bot.username) {
            if (message.charAt(0) === '!'){
                command = message.substring(1);
                handle(command, channelID);
            }
            else {
                reply(message, channelID);
            }
        }
    });
    
    function reply(message, channelID) {
        var words = message.split(" ");
            words.forEach(word => {
                //lowercase and remove all non alpha chars
                word = word.toLowerCase().replace(/[^a-z]/g, "");
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
            case 'play':
                answer = utilities.getRandom(replies.cumbia);
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
    !xd
    */
}
