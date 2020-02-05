var Discord = require('discord.js');
var logger = require('winston');
var replies = require('./memes/reply.json');
var utilities = require('./utilities');

var copypastas = utilities.loadCopypastas();
var custom_emojis;

//connect bot
exports.init = function(bot) {
    bot.on('ready', function (evt) {
        logger.info('Connected');
        logger.info(bot.user.username + ' - (' + bot.user.id + ')');

        custom_emojis = bot.emojis;
    });
    
    //reply to messages
    bot.on('message', function (discord_message) {
        message = discord_message.content;

        if(discord_message.author != bot.user) {
            message = message.toLowerCase();
            var words = message.split(" ");
            words.forEach((word, idx) => {
                //prefix '!' for special commands
                if (word.charAt(0) === '!'){
                    command = word.substring(1);
                    handle(command, words[idx+1], channelID);
                }

                reply(word, discord_message.channel);
            });
            react(discord_message);
        }
    });
}

function reply(word, channel) {
    word = word.replace(/[^a-z]/g, "");

    //gets value from corresponding key in ./memes/reply.json
    let reply = replies.memes[word];
    if (reply) {
        channel.send(reply)
    }
}

function handle(command, params, channel) {
    var reply;

    //special words preceded by !, can be anywhere in the sentence
    switch(command) {
        case 'copypasta':
            reply = utilities.getRandom(copypastas);
            break;
        case 'oraculo':
            reply = utilities.getRandom(replies.oraculo);
            break;
        case 'play':
            reply = utilities.getRandom(replies.cumbia);
            break;
        case 'roll':
            reply = utilities.roll(params);
            break;
    }
    if (reply) {
        channel.send(reply);
    }
}
function react(discord_message) {
    message = discord_message.content.toLowerCase();
    if (message.includes('jaja')) {
        discord_message.react(custom_emojis.get("435297735919403008"));
    }
}