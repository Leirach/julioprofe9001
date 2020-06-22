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
const ytdl_core_1 = __importDefault(require("ytdl-core"));
;
class QueueContruct {
    constructor(discord_message, voiceChannel) {
        this.textChannel = discord_message.channel;
        this.voiceChannel = voiceChannel;
        this.connection = null;
        this.songs = [];
        this.volume = 5;
        this.playing = true;
    }
}
let globalQueues = new json;
exports.musicCommands = {
    "play": play,
};
/**
 * Plays music?
 * @param discord_message
 * @param _args
 */
function play(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        const args = discord_message.content.split(" ");
        const voiceChannel = discord_message.member.voice.channel;
        if (!voiceChannel)
            return "You need to be in a voice channel to play music!";
        const permissions = voiceChannel.permissionsFor("312665173053931520");
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return "I need the permissions to join and speak in your voice channel!";
        }
        let song = {
            title: "",
            url: ""
        };
        try {
            let songInfo = yield ytdl_core_1.default.getInfo(args[1]);
            song.title = songInfo.title;
            song.url = songInfo.video_url;
        }
        catch (err) {
            return "No mames, eso no es un link";
        }
        let serverQueue = null;
        try {
            serverQueue = globalQueues[discord_message.guild.id];
        }
        catch (err) { }
        if (serverQueue) {
            serverQueue.songs.push(song);
            console.log(serverQueue.songs);
            return `${song.title} agregado a la playlist`;
        }
        let queue = new QueueContruct(discord_message, voiceChannel);
        // Setting the queue using our contract
        globalQueues[discord_message.guild.id] = queue;
        // Pushing the song to our songs array
        queue.songs.push(song);
        try {
            // Here we try to join the voicechat and save our connection into our object.
            var connection = yield voiceChannel.join();
            queue.connection = connection;
            // Calling the play function to start a song
            playSong(discord_message.guild, queue.songs[0]);
        }
        catch (err) {
            console.log(err);
            globalQueues[discord_message.guild.id];
            return "Lmao no me pude conectar";
        }
    });
}
function playSong(guild, song) {
    const serverQueue = globalQueues[guild.id];
    if (!song) {
        serverQueue.voiceChannel.leave();
        globalQueues[guild.id] = null;
        return;
    }
    const dispatcher = serverQueue.connection
        .play(ytdl_core_1.default(song.url))
        .on("finish", () => {
        serverQueue.songs.shift();
        playSong(guild, serverQueue.songs[0]);
    })
        .on("error", (error) => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
