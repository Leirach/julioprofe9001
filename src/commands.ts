/**
 * Command functions for the bot, keywords for commands are preceded by '!'.
 * Any message that needs to be sent and is not a reply can must be returned by
 * the function. Embeds can be return as long as it can be sent via the
 * channel.send() function.
 */
import { Message, GuildMember, User, TextChannel } from "discord.js";
import d20 from 'd20';;
import { config } from './config';
import { EmojifyMap, replies } from './replies';
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
    "emojify": emojify,
    "random": pingRandom
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
            await (discord_message.channel as TextChannel).send(chunk);
        }
    }
    catch (err) {
        console.error(err);
        return "lmao algo salio mal"
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
//TODO: refactor
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
            (discord_message.channel as TextChannel).send("Castigados");
        }
        else {
            (discord_message.channel as TextChannel).send("Castigado");
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
            (discord_message.channel as TextChannel).send("Descastigados");
        }
        else {
            (discord_message.channel as TextChannel).send("Descastigado");
        }
        return null;

    }
    else {
        return "No esté chingando";
    }
}

async function emojify(discord_message: Message, args: string[]): Promise<string> {
    let original: string;
    if (discord_message.reference) {
        const ref = await discord_message.fetchReference();
        original = ref.content;
    }
    else if (args.length > 0) {
        original = args.join(' ');
    }
    else {
        return "reply or msg XD";
    }

    let emojified = "";
    for (let char of original.toLowerCase()) {
        const emoji = EmojifyMap[char] || char;

        // dont add any more if length exceeds max
        if (emojified.length + emoji.length > 2000) break;

        emojified += emoji;
    }

    return emojified;
}

/**
 * Pings random online member
 */
async function pingRandom(discord_message: Message, _args: string[]) {
    const guild = discord_message.guild;

    const members = await guild.members.fetch();

    var online = members.filter(m => m.presence?.status == "online");

    return `<@${online.random().user.id}>`;
}
