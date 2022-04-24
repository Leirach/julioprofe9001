"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBot = void 0;
const discord_js_1 = require("discord.js");
const replies_1 = require("./replies");
const commands_1 = require("./commands");
const music_1 = require("./DJ/music");
const voiceChannelEvents_1 = require("./DJ/voiceChannelEvents");
const config_json_1 = __importDefault(require("./config.json"));
let bot;
const voiceStatus = voiceChannelEvents_1.VoiceStatusEventEmitter.getInstance();
function replyTo(discord_message) {
    var _a;
    if (discord_message.author.id == ((_a = bot.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return;
    }
    //reply to messages
    let message = discord_message.content;
    if (discord_message.content.startsWith(config_json_1.default.musicPrefix)) {
        var words = message.split(" ");
        const command = words[0].substring(1);
        djJulio(command, words.slice(1), discord_message);
        return;
    }
    message = message.toLowerCase();
    var words = message.split(" ");
    words.forEach((word, idx) => {
        //prefix '!' for special commands
        if (word.charAt(0) === config_json_1.default.prefix) {
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
function handle(command, args, discord_message) {
    return __awaiter(this, void 0, void 0, function* () {
        //commands are async functions, promise has to be handled
        //checks first if the command exists before trying to execute it
        //in commands.js
        if (commands_1.commands[command]) {
            let message = yield commands_1.commands[command](discord_message, args);
            if (message) {
                discord_message.channel.send(message);
            }
        }
    });
}
function djJulio(command, args, discord_message) {
    return __awaiter(this, void 0, void 0, function* () {
        if (music_1.musicCommands[command]) {
            let message = yield music_1.musicCommands[command](discord_message, args);
            if (message) {
                discord_message.channel.send(message);
            }
        }
    });
}
function react(discord_message) {
    let message = discord_message.content.toLowerCase();
    replies_1.reactions.forEach(reaction => {
        reaction.triggers.forEach((trigger) => __awaiter(this, void 0, void 0, function* () {
            //  original
            // if (message.includes(trigger)) {
            //     await discord_message.react(reaction.emoji);
            // }
            let regex = new RegExp(trigger);
            if (regex.test(message)) {
                yield discord_message.react(reaction.emoji);
            }
        }));
    });
}
function initBot(authToken) {
    return __awaiter(this, void 0, void 0, function* () {
        //init bot
        bot = new discord_js_1.Client({
            intents: [discord_js_1.Intents.FLAGS.GUILDS, discord_js_1.Intents.FLAGS.DIRECT_MESSAGES, discord_js_1.Intents.FLAGS.GUILD_MESSAGES, discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES],
        });
        yield bot.login(authToken);
        console.log('Connected!');
        if (bot.user)
            console.log(`${bot.user.username} - ${bot.user.id}`);
        bot.on("messageCreate", replyTo);
        // como verga meto esto a music.js
        bot.on("voiceStateUpdate", (oldState, newState) => {
            var _a, _b, _c, _d;
            // oldState check for disconnects
            if (((_a = oldState.channel) === null || _a === void 0 ? void 0 : _a.members.size) == 1) {
                // emit if bot is last in server
                if (((_b = oldState.channel) === null || _b === void 0 ? void 0 : _b.members.first().id) == bot.user.id) {
                    voiceStatus.emitEmpty(oldState.guild.id);
                }
            }
            if (((_c = newState.channel) === null || _c === void 0 ? void 0 : _c.members.size) > 1) {
                // emit only if bot is still in server
                if ((_d = newState.channel) === null || _d === void 0 ? void 0 : _d.members.get(bot.user.id)) {
                    voiceStatus.emitJoined(oldState.guild.id);
                }
            }
        });
    });
}
exports.initBot = initBot;
