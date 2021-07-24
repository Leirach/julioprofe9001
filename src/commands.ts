/**
 * Command functions for the bot, keywords for commands are preceded by '!'.
 * Any message that needs to be sent and is not a reply can must be returned by
 * the function. Embeds can be return as long as it can be sent via the
 * channel.send() function.
 */
import { Message, GuildMember, User, MessageEmbed } from "discord.js";
import d20 from 'd20';;
import config from './config.json';
import { replies } from './replies';
import * as utilities from './utilities';

var copypastas = utilities.loadCopypastas(config.cp_files);
var castigados: any[] = [];

/**
 * Declare any new commands here for the bot to handle
 * Then declare the function as an async function to resolve as promise.
 */
type FunctionDictionary = { [key: string]: Function };
export let commands: FunctionDictionary = {
    "copypasta": copypasta,
    "oraculo": oraculo,
    "play": playMeme,
    "roll": roll,
    "castigar": castigar,
}

/**
 * Returns a random copypasta to send
 * @param discord_message
 * @param _args
 */
async function copypasta(discord_message: Message, _args: string[]) {
    return utilities.getRandom(copypastas);
}

/**
 * 20% chance to send music meme or random reply from the "cumbia" array in replies.json
 * @param discord_message
 * @param _args
 */
async function playMeme(discord_message: Message, _args: string[]) {
    if (utilities.randBool(.2)) {
        return utilities.getRandom(replies.cumbia);
    }
    else if (utilities.randBool(.2)) {
        return new MessageEmbed()
            .setAuthor('Now Playing♪', 'https://images-ext-2.discordapp.net/external/2fG56UtfyTSowWQ6HhhPIV9VrZoD_OcVdHVwWpu6rIY/https/rythmbot.co/rythm.gif', 'https://chtm.joto')
            .setDescription("Cumbia Poder\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬\n\n04:20/05:69\n\nRequested by: Sero4")
            .setThumbnail('https://is4-ssl.mzstatic.com/image/thumb/Music/v4/46/aa/43/46aa4332-829b-84e6-9605-c6e183f6ca36/source/1200x1200bb.jpg')
    }
}

/**
 * Sends a random reply from the "oraculo" array in replies.json
 * @param {message} discord_message
 * @param {[String]} args
 */
async function oraculo(discord_message: Message, _args: string[]) {
    discord_message.reply(utilities.getRandom(replies.oraculo));
}

/**
 * Rolls the corresponding dice to the first argument
 * See https://www.npmjs.com/package/d20 for more info
 * @param discord_message
 * @param args
 */
async function roll(discord_message: Message, args: string[]) {
    if (args[0]) {
        return d20.roll(args[0]); // TODO: error checking
    }
    else {
        return "Usage: !roll (dice)"
    }
}

/**
 * SPAGHETTI CODE WARNING
 * Sends people to the purgatory channel, can send multiple people if they are all
 * mentioned in the same message. After 30 seconds returns them to their original
 * voice channel.
 * @param discord_message
 * @param _args
 */
async function castigar(discord_message: Message, _args: string[]) {
    const users: User[] = discord_message.mentions.users.array();
    let members: (GuildMember | null | undefined)[] = [];

    let vc: string | undefined;

    if (!users) { return "Usage: !castigar @wey"; }
    if (!discord_message.guild) { return "Aqui no uei"; }
    users.forEach(user => {
        members.push(discord_message.guild?.member(user));
    });
    vc = members[0]?.voice.channelID;

    //if member is in voice channel and its not purgatory, send him to the ranch
    if (vc && vc != config.purgatoryChannel) {
        castigados.push({ "members": members, "vc": vc });
        members.forEach(async (member) => {
            await member?.voice.setChannel(config.purgatoryChannel, "Castigado");
        });

        if (members.length > 1) {
            discord_message.channel.send("Castigados, papu");
        }
        else {
            discord_message.channel.send("Castigado, papu");
        }

        await utilities.sleep(30);

        //if member hasn't left the purgatory send him back to his original vc
        let aux = castigados.shift();
        let sentBack = 0;
        aux.members.forEach(async (member: GuildMember) => {
            if (member?.voice.channelID == config.purgatoryChannel) {
                await member?.voice.setChannel(aux.vc);
                sentBack += 1;
            }
        });
        if (sentBack > 1) {
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
