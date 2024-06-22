"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBot = initBot;
const replies_1 = require("./replies");
const commands_1 = require("./commands");
const music_1 = require("./DJ/music");
const voiceChannelEvents_1 = require("./DJ/voiceChannelEvents");
const config_1 = require("./config");
const botClass_1 = require("./botClass");
const voiceStatus = voiceChannelEvents_1.VoiceStatusEventEmitter.getInstance();
function replyTo(discord_message) {
    const bot = botClass_1.Bot.getInstance();
    if (discord_message.author.id == bot.user?.id || discord_message.author.bot) {
        return;
    }
    //reply to messages
    let message = discord_message.content;
    if (discord_message.content.startsWith(config_1.config.musicPrefix)) {
        var words = message.split(" ");
        const command = words[0].substring(1).toLowerCase();
        djJulio(command, words.slice(1), discord_message);
        return;
    }
    message = message.toLowerCase();
    var words = message.split(" ");
    words.forEach((word, idx) => {
        //prefix '!' for special commands
        if (word.charAt(0) === config_1.config.prefix) {
            const command = word.substring(1);
            handle(command, words.slice(idx + 1), discord_message);
        }
        respond(word, discord_message.channel);
    });
    react(discord_message);
}
function respond(word, channel) {
    //remove non-alpha chars
    word = word.replace(/[^a-z]/g, "");
    //gets value from corresponding key in ./memes/reply.json
    let reply = replies_1.replies.memes[word];
    if (reply) {
        channel.send(reply);
    }
}
async function handle(command, args, discord_message) {
    //commands are async functions, promise has to be handled
    //checks first if the command exists before trying to execute it
    //in commands.js
    if (commands_1.commands[command]) {
        let message = await commands_1.commands[command](discord_message, args);
        if (message) {
            discord_message.channel.send(message).catch(err => {
                console.error("lmao error enviando mensaje");
                console.error(err);
            });
        }
    }
}
async function djJulio(command, args, discord_message) {
    if (music_1.musicCommands[command]) {
        let message = await music_1.musicCommands[command](discord_message, args);
        if (message) {
            discord_message.channel.send(message);
        }
    }
}
function react(discord_message) {
    let message = discord_message.content.toLowerCase();
    replies_1.reactions.forEach(reaction => {
        reaction.triggers.forEach(async (trigger) => {
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
async function initBot(authToken) {
    const bot = botClass_1.Bot.getInstance();
    await bot.login(authToken);
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
