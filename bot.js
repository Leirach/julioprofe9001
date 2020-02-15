var Discord = require('discord.js');
var replies = require('./memes/reply.json');
var utilities = require('./utilities');
var config = require('./config.json');

var copypastas = utilities.loadCopypastas(config.cp_files);

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
            handle(command, words[idx+1], discord_message.channel, discord_message);
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

function handle(command, params, channel, discord_message) {
    var reply_msg;

    //special words preceded by !, can be anywhere in the sentence
    switch(command) {
        case 'copypasta':
            reply_msg = utilities.getRandom(copypastas);
            break;
        case 'oraculo':
            discord_message.reply( utilities.getRandom(replies.oraculo) );
            break;
        case 'play':
            if (utilities.randBool(.2)){
                reply_msg = utilities.getRandom(replies.cumbia);
            }
            else if (utilities.randBool(.2)){
                sendMusicMeme(channel);
            }
            break;
        case 'roll':
            reply_msg = utilities.roll(params);
            break;
        case 'castigar':
            castigar(discord_message, params);
    }
    if (reply_msg) {
        channel.send(reply_msg);
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
        .setDescription("Cumbia Poder\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬\n\n04:20/05:69\n\nRequested by: Sero4")
        .setThumbnail('https://is4-ssl.mzstatic.com/image/thumb/Music/v4/46/aa/43/46aa4332-829b-84e6-9605-c6e183f6ca36/source/1200x1200bb.jpg')

    channel.send(exampleEmbed);
}

async function castigar(discord_message, params) {
    const user = discord_message.mentions.users.first()
    if (!user){
        discord_message.reply("Usage: !castigar @wey");
        return ;
    }
    member = discord_message.guild.member(user);
    vc = member.voiceChannel;
    //if member is in voice channel and its not purgatory, send him to the ranch
    if (vc && vc.id != config.purgatoryChannel) {
        await member.setVoiceChannel(config.purgatoryChannel);
        discord_message.channel.send("Castigado, papu");
        await utilities.sleep(30);
        //if member hasn't left the purgatory send him back tohis original vc
        if(member.voiceChannel.id == config.purgatoryChannel) {
            await member.setVoiceChannel(vc);
            discord_message.channel.send("Descastigado, papu");
        }
    }
    else {
        discord_message.reply("No esté chingando");
    }
}
