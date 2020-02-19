/**
 * Command functions for the bot, keywords for commands are preceded by '!'.
 * Any message that needs to be sent and is not a reply can must be returned by
 * the function. Embeds can be return as long as it can be sent via the
 * channel.send() function.
 */
var Discord = require('discord.js');
var d20 = require('d20');
var config = require('./config.json');
var replies = require('./memes/reply.json');
var utilities = require('./utilities');

var copypastas = utilities.loadCopypastas(config.cp_files);

exports.commands = {
    "copypasta": copypasta,
    "oraculo": oraculo,
    "play": play,
    "roll": roll,
    "castigar": castigar,
}

castigados = [];

async function copypasta(discord_message, args) {
    return utilities.getRandom(copypastas);
}

async function play(discord_message, args) {
    if (utilities.randBool(.2)){
        return utilities.getRandom(replies.cumbia);
    }
    else if (utilities.randBool(.2)){
        const exampleEmbed = new Discord.RichEmbed()
            .setAuthor('Now Playing♪', 'https://images-ext-2.discordapp.net/external/2fG56UtfyTSowWQ6HhhPIV9VrZoD_OcVdHVwWpu6rIY/https/rythmbot.co/rythm.gif','https://chtm.joto')
            .setDescription("Cumbia Poder\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬\n\n04:20/05:69\n\nRequested by: Sero4")
            .setThumbnail('https://is4-ssl.mzstatic.com/image/thumb/Music/v4/46/aa/43/46aa4332-829b-84e6-9605-c6e183f6ca36/source/1200x1200bb.jpg')
        discord_message.channel.send(exampleEmbed);
    }
    return null;
}

async function oraculo(discord_message, args) {
    discord_message.reply( utilities.getRandom(replies.oraculo) );
}

async function roll(discord_message, args) {
    if (args[0]) {
        return d20.roll(args[0]);
     }
     else {
         return "Usage: !roll (dice)"
     }
}

/**
 * SPAGHETTI CODE WARNING
 * NEED TO REDO ASAP
 * @param {message} discord_message 
 * @param {[String]} args 
 */
async function castigar(discord_message, args) {
    const users = discord_message.mentions.users.array();
    let members = [];
    let vc;
    let sentBack = 0;

    if (!users) { return "Usage: !castigar @wey"; }
    if (!discord_message.guild) { return "Aqui no uei"; }
    users.forEach(user => {
        members.push(discord_message.guild.member(user));
    });
    vc = members[0].voiceChannel;

    //if member is in voice channel and its not purgatory, send him to the ranch
    if (vc && vc.id != config.purgatoryChannel) {
        castigados.push({"members": members, "vc":vc});
        members.forEach(async (member) => {
            await member.setVoiceChannel(config.purgatoryChannel);
        });

        if (members.length > 1){
            discord_message.channel.send("Castigados, papu");
        }
        else {
            discord_message.channel.send("Castigado, papu");
        }
        
        await utilities.sleep(30);

        //if member hasn't left the purgatory send him back to his original vc
        aux = castigados.shift();
        aux.members.forEach(async (member) => {
            if(member.voiceChannel.id == config.purgatoryChannel) {
                await member.setVoiceChannel(aux.vc);
                sentBack += 1
            }
        });
        if (sentBack > 1){
            discord_message.channel.send("Descastigados, papu");
        }
        else {
            discord_message.channel.send("Descastigado, papu");
        }
        return null;
        
    }
    else {
        return "No esté chingando";
    }
}
