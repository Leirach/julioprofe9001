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
exports.musicCommands = void 0;
const discord_js_1 = require("discord.js");
const musicClasses_1 = require("./musicClasses");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
let globalQueues = new discord_js_1.Collection();
exports.musicCommands = {
    "play": play,
    "queue": queue,
    "skip": skip,
};
/**
 * Plays music?
 * @param discord_message
 * @param _args
 */
function play(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        const voiceChannel = discord_message.member.voice.channel;
        let url = discord_message.content.split(' ')[1];
        if (!voiceChannel)
            return "You need to be in a voice channel to play music!";
        const permissions = voiceChannel.permissionsFor("312665173053931520");
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return "I need the permissions to join and speak in your voice channel!";
        }
        let song;
        try {
            console.log(url);
            let songInfo = yield ytdl_core_1.default.getInfo(url);
            songInfo.length_seconds;
            song = new musicClasses_1.Song(songInfo.title, url, songInfo.length_seconds);
        }
        catch (err) {
            return "No mames, eso no es un link";
        }
        let serverQueue = globalQueues.get(discord_message.guild.id);
        if (serverQueue) {
            serverQueue.songs.push(song);
            console.log(serverQueue.songs);
            return `${song.title} agregado a la playlist`;
        }
        let queue = new musicClasses_1.QueueContruct(discord_message, voiceChannel);
        // Setting the queue using our contract
        globalQueues.set(discord_message.guild.id, queue);
        // Pushing the song to our songs array
        queue.songs.push(song);
        try {
            // Here we try to join the voicechat and save our connection into our object.
            var connection = yield voiceChannel.join();
            queue.connection = connection;
            // Calling the playSong function to start a song
            playSong(discord_message.guild, queue.songs[0]);
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
        let msg = `Now playing: ${next10[0]}\nUp Next:\n`;
        next10.forEach((song, idx) => {
            if (idx > 0) {
                msg.concat(`${idx}: ${song.title}\n`);
            }
        });
        return msg;
    });
}
function skip(discord_message, _args) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    if (!serverQueue)
        return "No hay ni madres en la cola";
    serverQueue.connection.dispatcher.end();
}
