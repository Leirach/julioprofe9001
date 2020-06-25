"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.musicCommands = void 0;
const discord_js_1 = require("discord.js");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const musicClasses_1 = require("./musicClasses");
const ytUitls = __importStar(require("./youtubeUtils"));
const utilities_1 = require("../utilities");
let globalQueues = new discord_js_1.Collection();
exports.musicCommands = {
    "play": play,
    "queue": queue,
    "skip": skip,
    "stop": stop,
    "dc": stop,
    "shuffle": shuffle
};
/**
 * Plays music?
 * @param discord_message
 * @param args
 */
function play(discord_message, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const voiceChannel = discord_message.member.voice.channel;
        if (!voiceChannel)
            return "No estás conectado en vc";
        const permissions = voiceChannel.permissionsFor("312665173053931520");
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return "Necesito permisos para conectar en ese canal";
        }
        // tries to parse url
        let result;
        if (utilities_1.isURL(args[0])) {
            console.log(`getting from url ${args[0]}`);
            result = yield ytUitls.getSongs(args[0]);
        }
        else {
            if (!args.join(' ')) {
                return "Tocame esta XD";
            }
            console.log(`searching for ${args.join(' ')}`);
            result = yield ytUitls.searchYT(args.join(' '));
        }
        //if a queueContract already exists (bot is already playing a song)
        // push a song in the array and return confirmation message
        let serverQueue = globalQueues.get(discord_message.guild.id);
        if (serverQueue) {
            // if its a song push it, otherwise concat the whole fucking array
            if (result instanceof musicClasses_1.Song) {
                serverQueue.songs.push(result);
                return `**${result.title}** agregado a la playlist`;
            }
            else {
                serverQueue.songs = serverQueue.songs.concat(result);
                return `Agregads un chingo de canciones`;
            }
        }
        // Otherwise create new contract and start playing music boi
        serverQueue = new musicClasses_1.QueueContract(discord_message, voiceChannel);
        globalQueues.set(discord_message.guild.id, serverQueue);
        if (result instanceof musicClasses_1.Song) {
            console.log("pushing song");
            serverQueue.songs.push(result);
        }
        else {
            console.log("concatenating playlist");
            serverQueue.songs = serverQueue.songs.concat(result);
        }
        console.log(serverQueue.songs[0]);
        try {
            serverQueue.connection = yield voiceChannel.join();
            playSong(discord_message.guild, serverQueue.songs[0]);
        }
        catch (err) {
            console.log(err);
            globalQueues.delete(discord_message.guild.id);
            return "Lmao no me pude conectar";
        }
    });
}
function playSong(guild, song) {
    const serverQueue = globalQueues.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        globalQueues.delete(guild.id);
        return;
    }
    const dispatcher = serverQueue.connection
        .play(ytdl_core_1.default(song.url))
        .on("finish", () => {
        serverQueue.songs.shift();
        playSong(guild, serverQueue.songs[0]);
    })
        .on("error", (error) => {
        console.error(error);
    });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    //serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
function queue(discord_message, _args) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const serverQueue = globalQueues.get((_a = discord_message.guild) === null || _a === void 0 ? void 0 : _a.id);
        if (!serverQueue || !serverQueue.songs) {
            return "No hay ni madres aqui";
        }
        const next10 = serverQueue.songs.slice(0, 11);
        var msg = `Now playing: ${next10[0].title}\nUp Next:\n`;
        next10.forEach((song, idx) => {
            if (idx > 0) {
                msg = msg.concat(`${idx}: ${song.title}\n`);
            }
        });
        console.log(next10.length);
        if (next10.length < 2) {
            msg = msg.concat("Nada XD");
        }
        return msg;
    });
}
function skip(discord_message, _args) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return "Ni estoy tocando música";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    serverQueue.connection.dispatcher.end();
}
function stop(discord_message, _args) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return "Ni estoy tocando música";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}
function playtop(discord_message, _args) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return play(discord_message, _args);
}
function playskip(discord_message, _args) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return play(discord_message, _args);
    //serverQueue.songs.splice(1, 0, item);
    serverQueue.connection.dispatcher.end();
}
function shuffle(discord_message, _args) {
    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return "No hay ni madres aquí";
    let songs = serverQueue.songs.slice(1);
    songs = utilities_1.shuffleArray(songs);
    songs.unshift(serverQueue.songs[0]);
    serverQueue.songs = songs;
}
