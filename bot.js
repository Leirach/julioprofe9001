var Discord = require('discord.js');
var replies = require('./memes/reply.json');
var utilities = require('./utilities');
var { commands } = require('./commands');

exports.replyTo = (discord_message) => {
    //reply to messages
    message = discord_message.content;
    if (discord_message.author.id == bot.user.id){
        return ;
    }

    message = message.toLowerCase();
    var words = message.split(" ");
    words.forEach((word, idx) => {
        //prefix '!' for special commands
        if (word.charAt(0) === '!'){
            command = word.substring(1);
            handle(command, words.slice(idx+1), discord_message);
        }

        reply(word, discord_message.channel);
    });
    react(discord_message);
}

function reply(word, channel) {
    word = word.replace(/[^a-z]/g, "");

    //gets value from corresponding key in ./memes/reply.json
    let reply = replies.memes[word];
    if (reply) {
        channel.send(reply)
    }
}

function handle(command, args, discord_message) {
    //commands are async functions, promise has to be handled
    //checks first if the command exists before trying to execute it
    //in commands.js
    if (commands[command]){
        commands[command](discord_message, args)
        .then(message => {
            if (message) {
                discord_message.channel.send(message);
            }
        })
    }
}

function react(discord_message) {
    message = discord_message.content.toLowerCase();

    replies.reactions.forEach(reaction => {
        reaction.triggers.forEach(async trigger => {
            if (message.includes(trigger)) {
                if (reaction.guild_emoji){
                    await discord_message.react(bot.emojis.get(reaction.emoji));
                }
                else {
                    await discord_message.react(reaction.emoji);
                }
            }
        });
    });
}
