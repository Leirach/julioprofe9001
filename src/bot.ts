import { Message, TextChannel } from "discord.js";
import { replies, reactions } from './replies';
import { commands } from './commands';
import { musicCommands } from './DJ/music';
import { VoiceStatusEventEmitter } from './DJ/voiceChannelEvents'
import { config } from './config';
import { Bot } from "./botClass";

const voiceStatus = VoiceStatusEventEmitter.getInstance();

function replyTo(this: Bot, discord_message: Message) {
    const bot = Bot.getInstance()
    if (discord_message.author.id == bot.user?.id || discord_message.author.bot) {
        return;
    }
    //reply to messages
    let message = discord_message.content;

    if (discord_message.content.startsWith(config.musicPrefix)) {
        var words = message.split(" ");
        const command = words[0].substring(1).toLowerCase();
        djJulio(command, words.slice(1), discord_message);
        return;
    }

    message = message.toLowerCase();
    var words = message.split(" ");
    words.forEach((word, idx) => {
        //prefix '!' for special commands
        if (word.charAt(0) === config.prefix) {
            const command = word.substring(1);
            handle(command, words.slice(idx + 1), discord_message);
        }

        respond(word, discord_message.channel as TextChannel);
    });
    react(discord_message);
}

function respond(word: string, channel: TextChannel) {
    //remove non-alpha chars
    word = word.replace(/[^a-z]/g, "");

    //gets value from corresponding key in ./memes/reply.json
    let reply = replies.memes[word];
    if (reply) {
        channel.send(reply)
    }
}

async function handle(command: string, args: string[], discord_message: Message) {
    //commands are async functions, promise has to be handled
    //checks first if the command exists before trying to execute it
    //in commands.js
    if (commands[command]) {
        let message = await commands[command](discord_message, args)
        if (message) {
            (discord_message.channel as TextChannel).send(message).catch(err => {
                console.error("lmao error enviando mensaje")
                console.error(err);
            });
        }
    }
}

async function djJulio(command: string, args: string[], discord_message: Message) {
    if (musicCommands[command]) {
        let message = await musicCommands[command](discord_message, args)
        if (message) {
            (discord_message.channel as TextChannel).send(message);
        }
    }
}

function react(discord_message: Message) {
    let message = discord_message.content.toLowerCase();

    reactions.forEach(reaction => {
        reaction.triggers.forEach(async trigger => {
            //  original
            // if (message.includes(trigger)) {
            //     await discord_message.react(reaction.emoji);
            // }
            let regex = new RegExp(trigger);
            if (regex.test(message)) {
                await discord_message.react(reaction.emoji);
            }
        });
    });
}

export async function initBot(authToken: string) {
    const bot = Bot.getInstance();

    await bot.login(authToken)
    console.log('Connected!');
    if (bot.user)
        console.log(`${bot.user.username} - ${bot.user.id}`);

    bot.on("messageCreate", replyTo);

    // checks for empty voice channel to disconnect
    bot.on("voiceStateUpdate", (oldState, newState) => {
        // oldState check for disconnects
        if (oldState.channel?.members.size == 1) {
            // emit if bot is last in server
            if (oldState.channel?.members.first().id == bot.user.id) {
                voiceStatus.emitEmpty(oldState.guild.id);
            }
        }

        if (newState.channel?.members.size > 1) {
            // emit only if bot is still in server
            if (newState.channel?.members.get(bot.user.id)) {
                voiceStatus.emitJoined(oldState.guild.id);
            }
        }
    });
}