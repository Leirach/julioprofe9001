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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
const voice_1 = require("@discordjs/voice");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const musicClasses_1 = require("./musicClasses");
const ytUitls = __importStar(require("./youtubeUtils"));
const utilities_1 = require("../utilities");
const config_1 = require("../config");
const GlobalQueueMap_1 = require("./GlobalQueueMap");
const botClass_1 = require("../botClass");
const bufferSize = 1 << 25;
let globalQueues = GlobalQueueMap_1.GlobalQueueManager.getInstance();
exports.musicCommands = {
    "play": play,
    "queue": queue,
    "skip": skip,
    "stop": stop,
    "dc": stop,
    "shuffle": shuffle,
    "playtop": playtop,
    "pt": playtop,
    "playskip": playskip,
    "ps": playskip,
    "volume": volume,
    "np": nowPlaying,
    "loop": loop,
    "playlist": playlist,
    "pp": preloadPlaylist,
    "prev": lastPlayed,
    "lp": lastPlayed,
};
function preloadPlaylist(discord_message, args) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield ytUitls.cachePlaylist(true);
        }
        catch (err) {
            return `Lmao la cagué: ${err}`;
        }
        return "Big pp, done.";
    });
}
function playlist(discord_message, args) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield play(discord_message, [config_1.config.playlist], true);
    });
}
/**
 * Plays music!
 */
function play(discord_message, args, preshuffle) {
    return __awaiter(this, void 0, void 0, function* () {
        const bot = botClass_1.Bot.getInstance();
        const voiceChannel = discord_message.member.voice.channel;
        if (!voiceChannel)
            return "No estás conectado en vc";
        const permissions = voiceChannel.permissionsFor(bot.user.id);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return "Necesito permisos para conectar en ese canal";
        }
        // tries to parse url
        let result;
        let sendEmbed;
        if ((0, utilities_1.isURL)(args[0])) {
            result = yield ytUitls.getSongs(args[0]);
            sendEmbed = false;
        }
        else {
            if (!args.join(' ')) {
                return "Tocame esta XD";
            }
            result = yield ytUitls.searchYT(args.join(' '));
            sendEmbed = true;
        }
        //if a queueContract already exists (bot is already playing a song)
        // push a song in the array and return confirmation message
        let serverQueue = globalQueues.get(discord_message.guild.id);
        if (serverQueue) {
            // if its a song push it, otherwise concat the whole fucking array
            if (result instanceof musicClasses_1.Song) {
                serverQueue.songs.push(result);
                return sendEmbed ? ytUitls.songEmbed("Agregado", result, 0) : "Yastas";
            }
            else {
                // TODO: preshuffle and handle arrays better
                if (preshuffle)
                    result = (0, utilities_1.shuffleArray)(result);
                serverQueue.songs = serverQueue.songs.concat(result);
                return `Agregadas un chingo de canciones`;
            }
        }
        // Otherwise create new contract and start playing music boi
        serverQueue = new musicClasses_1.QueueContract(discord_message, voiceChannel);
        globalQueues.set(discord_message.guild.id, serverQueue);
        if (result instanceof musicClasses_1.Song) {
            serverQueue.songs.push(result);
        }
        else {
            // TODO: preshuffle and handle arrays better (same as above)
            if (preshuffle)
                result = (0, utilities_1.shuffleArray)(result);
            serverQueue.songs = serverQueue.songs.concat(result);
        }
        try {
            const song = serverQueue.songs[0];
            if (sendEmbed) {
                serverQueue.textChannel.send(ytUitls.songEmbed("Now Playing", song, 0));
            }
            else {
                serverQueue.textChannel.send(`Now playing: ${song.title}`);
            }
            serverQueue.connection = (0, voice_1.joinVoiceChannel)({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            });
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
        serverQueue.connection.destroy();
        globalQueues.delete(guild.id);
        return;
    }
    // Help, im only supposed to increase this param in ytdl and i dont even know why
    // { highWaterMark: 1024 * 1024 * 10 } // 10mb buffer, supposedly
    console.log("getting ytdl song");
    serverQueue.currentTrack = (0, voice_1.createAudioResource)((0, ytdl_core_1.default)(song.url, { filter: 'audioonly', highWaterMark: bufferSize }), { inlineVolume: true });
    console.log("ytdl got");
    let vol = ytUitls.getVolume(song.url);
    serverQueue.currentTrack.volume.setVolumeLogarithmic(vol / 5);
    if (!serverQueue.player) {
        serverQueue.player = (0, voice_1.createAudioPlayer)();
        serverQueue.connection.subscribe(serverQueue.player);
        serverQueue.player.on("stateChange", (state) => {
            console.log(state.status);
            console.log(serverQueue.currentTrack.ended);
            if (serverQueue.currentTrack.ended) {
                if (!serverQueue.loop)
                    serverQueue.lastPlayed = serverQueue.songs.shift();
                playSong(guild, serverQueue.songs[0]);
            }
        })
            .on("error", (error) => {
            console.error(error);
            let np = serverQueue.songs.shift();
            let embed = new discord_js_1.MessageEmbed()
                .setAuthor("No se puede reproducir:", config_1.config.avatarUrl)
                .setTitle(np.title)
                .setURL(np.url)
                .setDescription(`Razon: ${error.message}`)
                .setThumbnail(config_1.config.errorImg)
                .setImage(np.thumbnail);
            serverQueue.textChannel.send({ embeds: [embed] });
            playSong(guild, serverQueue.songs[0]);
        });
    }
    console.log("playing track here");
    serverQueue.player.play(serverQueue.currentTrack);
}
function skip(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverQueue = globalQueues.get(discord_message.guild.id);
        if (!serverQueue)
            return "Ni estoy tocando música";
        if (!discord_message.member.voice.channel)
            return "No mames, ni la estás oyendo";
        const looping = serverQueue.loop;
        serverQueue.loop = false;
        serverQueue.player.stop();
        serverQueue.loop = looping;
    });
}
function stop(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverQueue = globalQueues.get(discord_message.guild.id);
        if (!serverQueue)
            return "Ni estoy tocando música";
        if (!discord_message.member.voice.channel)
            return "No mames, ni la estás oyendo";
        serverQueue.songs = [];
        serverQueue.player.stop();
    });
}
function playtop(discord_message, args, status) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverQueue = globalQueues.get(discord_message.guild.id);
        if (!status)
            status = { ok: false };
        if (!serverQueue) {
            status.ok = false;
            return play(discord_message, args);
        }
        let result;
        let msg;
        if ((0, utilities_1.isURL)(args[0])) {
            result = yield ytUitls.getSongs(args[0]);
            msg = "Yastas";
            status.ok = true;
        }
        else {
            if (!args.join(' ')) {
                status.ok = false;
                return "Tocame esta XD";
            }
            result = yield ytUitls.searchYT(args.join(' '));
            msg = ytUitls.songEmbed("Sigue", result, 0);
            status.ok = true;
        }
        if (!(result instanceof musicClasses_1.Song)) {
            status.ok = false;
            return "Nel, no puedo agregar playlists";
        }
        serverQueue.songs.splice(1, 0, result);
        status.ok = true;
        return msg;
    });
}
//TODO: bug playskip without arguments and without queue
function playskip(discord_message, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverQueue = globalQueues.get(discord_message.guild.id);
        let status = { ok: false };
        let reply = yield playtop(discord_message, args, status);
        if (status.ok) {
            serverQueue.player.stop();
        }
        return reply;
    });
}
function shuffle(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        let serverQueue = globalQueues.get(discord_message.guild.id);
        if (!(serverQueue === null || serverQueue === void 0 ? void 0 : serverQueue.songs))
            return "No hay ni madres aquí";
        let songs = serverQueue.songs.slice(1);
        songs = (0, utilities_1.shuffleArray)(songs);
        songs.unshift(serverQueue.songs[0]);
        serverQueue.songs = songs;
        return "Shuffled 😩👌";
    });
}
function volume(discord_message, args) {
    return __awaiter(this, void 0, void 0, function* () {
        let serverQueue = globalQueues.get(discord_message.guild.id);
        if (!(serverQueue === null || serverQueue === void 0 ? void 0 : serverQueue.songs))
            return "No hay ni madres aquí";
        if (!args[0]) {
            return `Volume: ${ytUitls.getVolume(serverQueue.songs[0].url)}`;
        }
        let volume = parseInt(args[0]);
        if (isNaN(volume))
            return "No mames eso no es un número";
        if (volume < 0)
            volume = 0;
        if (volume > 10) {
            return "No creo que eso sea una buena idea";
        }
        ytUitls.setVolume(serverQueue.songs[0].url, volume);
        serverQueue.currentTrack.volume.setVolumeLogarithmic(volume / 5);
    });
}
function nowPlaying(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverQueue = globalQueues.get(discord_message.guild.id);
        if (!(serverQueue === null || serverQueue === void 0 ? void 0 : serverQueue.songs))
            return "No hay ni madres aquí";
        //get song and send fancy embed
        const np = serverQueue.songs[0];
        // get time and format it accordingly
        let time = serverQueue.currentTrack.playbackDuration;
        return ytUitls.songEmbed("Now playing", np, time);
    });
}
function queue(discord_message, _args) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const serverQueue = globalQueues.get((_a = discord_message.guild) === null || _a === void 0 ? void 0 : _a.id);
        if (!(serverQueue === null || serverQueue === void 0 ? void 0 : serverQueue.songs)) {
            return "No hay ni madres aqui";
        }
        let queue_idx = 0;
        let sent = yield discord_message.channel.send(ytUitls.queueEmbed(serverQueue.songs, queue_idx));
        const collector = discord_message.channel.createMessageComponentCollector({ time: 15000 });
        collector.on('collect', (interaction) => __awaiter(this, void 0, void 0, function* () {
            if (interaction.message.id !== sent.id)
                return;
            collector.resetTimer();
            if (interaction.customId == ytUitls.INTERACTION_PREV_ID) {
                queue_idx -= 10;
            }
            if (interaction.customId == ytUitls.INTERACTION_NEXT_ID) {
                queue_idx += 10;
            }
            yield interaction.update(ytUitls.queueEmbed(serverQueue.songs, queue_idx));
        }));
    });
}
function loop(discord_message, args) {
    return __awaiter(this, void 0, void 0, function* () {
        let serverQueue = globalQueues.get(discord_message.guild.id);
        if (!(serverQueue === null || serverQueue === void 0 ? void 0 : serverQueue.songs))
            return "No hay ni madres aquí";
        if (!discord_message.member.voice.channel)
            return "No mames, ni la estás oyendo";
        serverQueue.loop = !serverQueue.loop;
        if (serverQueue.loop)
            return "Loop-the-loop";
        else
            return "No more loop";
    });
}
function lastPlayed(discord_message, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverQueue = globalQueues.get(discord_message.guild.id);
        if (!(serverQueue === null || serverQueue === void 0 ? void 0 : serverQueue.songs))
            return "No hay ni madres aquí";
        // send last played embed
        const lp = serverQueue.lastPlayed;
        return ytUitls.songEmbed("Last played", lp, 0);
    });
}
