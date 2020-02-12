var Discord = require('discord.js');
var logger = require('winston');
var replies = require('./memes/reply.json');
var utilities = require('./utilities');

var copypastas = utilities.loadCopypastas();

exports.replyTo = (discord_message) => {
    //reply to messages
    message = discord_message.content;

    if(discord_message.author != bot.user) {
        message = message.toLowerCase();
        var words = message.split(" ");
        words.forEach((word, idx) => {
            //prefix '!' for special commands
            if (word.charAt(0) === '!'){
                command = word.substring(1);
                handle(command, words[idx+1], discord_message.channel);
            }

            reply(word, discord_message.channel);
        });
        react(discord_message);
    }
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
            if (utilities.randBool(.2)){
                reply = utilities.getRandom(replies.cumbia);
            }
            else if (utilities.randBool(.2)){
                sendMusicMeme(channel);
            }
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

    replies.reactions.forEach(reaction => {
        reaction.triggers.forEach(trigger => {
            if (message.includes(trigger)) {
                if (reaction.guild_emoji){
                    discord_message.react(bot.emojis.get(reaction.emoji));
                }
                else {
                    discord_message.react(reaction.emoji);
                }
            }
        });
    });
}

function sendMusicMeme(channel){
    const exampleEmbed = new Discord.RichEmbed()
        .setAuthor('Now Playing♪', 'https://images-ext-2.discordapp.net/external/2fG56UtfyTSowWQ6HhhPIV9VrZoD_OcVdHVwWpu6rIY/https/rythmbot.co/rythm.gif','https://chtm.joto')
        .setDescription("Cumbia Poder\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬\n\n04:20/05:69\n\nRequested by: Sero4")
        .setThumbnail('https://is4-ssl.mzstatic.com/image/thumb/Music/v4/46/aa/43/46aa4332-829b-84e6-9605-c6e183f6ca36/source/1200x1200bb.jpg')

    channel.send(exampleEmbed);
}
