/**
 * Command functions for the bot, keywords for commands are preceded by '!'.
 * Any message that needs to be sent and is not a reply can must be returned by
 * the function. Embeds can be return as long as it can be sent via the
 * channel.send() function.
 */
import { Message, GuildMember, User, MessageEmbed, MessageOptions } from "discord.js";
import d20 from 'd20';;
import { config } from './config';
import { replies } from './replies';
import * as utilities from './utilities';
import axios from 'axios';

var castigados: any[] = [];

/**
 * Declare any new commands here for the bot to handle
 * Then declare the function as an async function to resolve as promise.
 */
type FunctionDictionary = { [key: string]: Function };
export let commands: FunctionDictionary = {
    "copypasta": copypasta,
    "oraculo": oraculo,
    "roll": roll,
    "castigar": castigar,
}

/**
 * Returns a random copypasta to send
 */
async function copypasta(discord_message: Message, _args: string[]) {
    try {
        const res = await axios.get('https://www.reddit.com/r/copypasta/random.json');

        const title = res.data[0].data.children[0].data.title;
        const text = res.data[0].data.children[0].data.selftext;

        const msg = `**${title}**\n${text}`;

        for (let i = 0; i < msg.length; i += 2000) {
            const chunk = msg.slice(i, i + 2000);
            await discord_message.channel.send(chunk);
        }
    }
    catch (err) {
        console.error(err);
        return "lmao algo salio mal"
    }

}

/**
 * @deprecated
 * good meme, stays here
 * 20% chance to send music meme or random reply from the "cumbia" array in replies.json
 */
async function playMeme(discord_message: Message, _args: string[]): Promise<MessageOptions | string> {
    if (utilities.randBool(.2)) {
        return utilities.getRandom(replies.cumbia);
    }
    else if (utilities.randBool(.2)) {
        const embed = new MessageEmbed()
            .setAuthor('Now Playing♪', 'https://images-ext-2.discordapp.net/external/2fG56UtfyTSowWQ6HhhPIV9VrZoD_OcVdHVwWpu6rIY/https/rythmbot.co/rythm.gif', 'https://chtm.joto')
            .setDescription("Cumbia Poder\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬\n\n04:20/05:69\n\nRequested by: Sero4")
            .setThumbnail('https://is4-ssl.mzstatic.com/image/thumb/Music/v4/46/aa/43/46aa4332-829b-84e6-9605-c6e183f6ca36/source/1200x1200bb.jpg')
        return {
            embeds: [embed]
        }
    }
}

/**
 * Sends a random reply from the "oraculo" array in replies.json
 */
async function oraculo(discord_message: Message, _args: string[]) {
    discord_message.reply(utilities.getRandom(replies.oraculo));
}

/**
 * Rolls the corresponding dice to the first argument
 * See https://www.npmjs.com/package/d20 for more info
 */
async function roll(discord_message: Message, args: string[]) {
    if (args[0]) {
        return d20.roll(args[0]).toString();
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
 */
async function castigar(discord_message: Message, _args: string[]) {
    const users: User[] = discord_message.mentions.users.toJSON();
    let members: (GuildMember | null | undefined)[] = [];

    let vc: string | undefined;

    if (!users) { return "Usage: !castigar @wey"; }
    if (!discord_message.guild) { return "Aqui no uei"; }
    for (let user of users) {
        members.push(await discord_message.guild?.members.fetch(user));
    }
    vc = members[0]?.voice.channelId;

    //if member is in voice channel and its not purgatory, send him to the ranch
    if (vc && vc != config.purgatoryChannel) {
        castigados.push({ "members": members, "vc": vc });
        members.forEach(async (member) => {
            await member?.voice.setChannel(config.purgatoryChannel, "Castigado");
        });

        if (members.length > 1) {
            discord_message.channel.send("Castigados");
        }
        else {
            discord_message.channel.send("Castigado");
        }

        await utilities.sleep(30);

        //if member hasn't left the purgatory send him back to his original vc
        let aux = castigados.shift();
        let sentBack = 0;
        aux.members.forEach(async (member: GuildMember) => {
            if (member?.voice.channelId == config.purgatoryChannel) {
                await member?.voice.setChannel(aux.vc);
                sentBack += 1;
            }
        });
        if (sentBack > 1) {
            discord_message.channel.send("Descastigados");
        }
        else {
            discord_message.channel.send("Descastigado");
        }
        return null;

    }
    else {
        return "No esté chingando";
    }
}
