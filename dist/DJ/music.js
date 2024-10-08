"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.musicCommands = void 0;
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
const queueContract_1 = require("./queueContract");
const musicUtils = __importStar(require("./musicUtils"));
const youtubeClient = __importStar(require("./youtubeClient"));
const utilities_1 = require("../utilities");
const config_1 = require("../config");
const globalQueueManager_1 = require("./globalQueueManager");
const botClass_1 = require("../botClass");
//TODO: separate file into different commands/utils or something else
const bufferSize = 1 << 25;
let globalQueues = globalQueueManager_1.GlobalQueueManager.getInstance();
let ytdlAgent;
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
async function preloadPlaylist(discord_message, args) {
    var dumbQueue = new queueContract_1.QueueContract(discord_message, null);
    try {
        await youtubeClient.getCachePlaylist(dumbQueue, true);
    }
    catch (err) {
        return `Lmao la cagué: ${err}`;
    }
    return "Cargando playlist";
}
async function playlist(discord_message, args) {
    return await play(discord_message, [config_1.config.playlist], true);
}
/**
 * Plays music!
 */
async function play(discord_message, args, preshuffle) {
    const bot = botClass_1.Bot.getInstance();
    const voiceChannel = discord_message.member.voice.channel;
    if (!voiceChannel)
        return "No estás conectado en vc";
    const permissions = voiceChannel.permissionsFor(bot.user.id);
    if (!permissions.has(discord_js_1.PermissionFlagsBits.Connect) || !permissions.has(discord_js_1.PermissionFlagsBits.Speak)) {
        return "Necesito permisos para conectar en ese canal";
    }
    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue) {
        serverQueue = new queueContract_1.QueueContract(discord_message, voiceChannel);
    }
    let sendEmbed;
    let isPlaylist;
    if ((0, utilities_1.isURL)(args[0])) {
        isPlaylist = await youtubeClient.addSongsToQueueAsync(serverQueue, args[0]);
        sendEmbed = false;
    }
    else {
        if (!args.join(' ')) {
            return "Tocame esta XD";
        }
        serverQueue.songs.push(await youtubeClient.searchYT(args.join(' ')));
        isPlaylist = false;
        sendEmbed = true;
    }
    if (isPlaylist && preshuffle) {
        serverQueue.shufflePlaylist();
    }
    // if player already exists
    // push a song in the array and return confirmation message
    if (serverQueue.player != null) {
        if (!isPlaylist) {
            return sendEmbed ? musicUtils.songEmbed("Agregado", serverQueue.songs[0], 0) : "Yastas";
        }
        else {
            return "Agregadas un chingo de canciones";
        }
    }
    // TODO: MOVE TO ANOTHER METHOD
    // Save new queue, in case anything failed above
    globalQueues.set(discord_message.guild.id, serverQueue);
    try {
        const song = serverQueue.songs[0];
        serverQueue.connection = (0, voice_1.joinVoiceChannel)({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });
        playSong(discord_message.guild, serverQueue.songs[0]);
        if (sendEmbed) {
            serverQueue.textChannel.send(musicUtils.songEmbed("Now Playing", song, 0));
        }
        else {
            serverQueue.textChannel.send(`Now playing: ${song.title}`);
        }
    }
    catch (err) {
        console.log(err);
        globalQueues.delete(discord_message.guild.id);
        return "Lmao no me pude conectar";
    }
}
// TODO: better logs here
function playSong(guild, song) {
    const serverQueue = globalQueues.get(guild.id);
    if (!song) {
        serverQueue?.subscription.unsubscribe();
        serverQueue?.connection.destroy();
        globalQueues.delete(guild.id);
        return;
    }
    // Help, im only supposed to increase this param in ytdl and i dont even know why
    // { highWaterMark: 1024 * 1024 * 10 } // 10mb buffer, supposedly
    const stream = (0, ytdl_core_1.default)(song.url, {
        filter: 'audioonly',
        highWaterMark: bufferSize,
        agent: GetAgent()
    });
    serverQueue.currentTrack = (0, voice_1.createAudioResource)(stream, { inlineVolume: true });
    let vol = musicUtils.getVolume(song.url);
    serverQueue.currentTrack.volume.setVolumeLogarithmic(vol / 5);
    if (!serverQueue.player) {
        serverQueue.player = (0, voice_1.createAudioPlayer)();
        serverQueue.subscription = serverQueue.connection.subscribe(serverQueue.player);
        serverQueue.player.on("stateChange", (oldState, newState) => {
            if (serverQueue.currentTrack.ended) {
                if (!serverQueue.loop)
                    serverQueue.lastPlayed = serverQueue.songs.shift();
                playSong(guild, serverQueue.songs[0]);
            }
        })
            .on("error", (error) => {
            console.error(error);
            let np = serverQueue.songs.shift();
            let embed = new discord_js_1.EmbedBuilder()
                .setAuthor({ name: "No se puede reproducir:", url: config_1.config.avatarUrl })
                .setTitle(np.title)
                .setURL(np.url)
                .setDescription(`Razon: ${error.message}`)
                .setThumbnail(config_1.config.errorImg)
                .setImage(np.thumbnail);
            serverQueue.textChannel.send({ embeds: [embed] });
            playSong(guild, serverQueue.songs[0]);
        });
    }
    serverQueue.player.play(serverQueue.currentTrack);
}
async function skip(discord_message, _args) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return "Ni estoy tocando música";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    const looping = serverQueue.loop;
    serverQueue.loop = false;
    serverQueue.player.stop();
    serverQueue.loop = looping;
}
async function stop(discord_message, _args) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return "Ni estoy tocando música";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    serverQueue.songs = [];
    serverQueue.player.stop();
}
async function playtop(discord_message, args, skipCurrent = false) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue) {
        return play(discord_message, args);
    }
    if (args.length == 0) {
        return "Tocame esta XD";
    }
    if ((0, utilities_1.isURL)(args[0])) {
        let songs = await youtubeClient.getSongsFromUrl(args[0]);
        if (songs.length == 0) {
            return "No lo pudo agregar lmao";
        }
        serverQueue.songs.splice(1, 0, ...songs);
        if (skipCurrent)
            serverQueue.player.stop();
        return "Yastas";
    }
    else {
        let song = await youtubeClient.searchYT(args.join(' '));
        serverQueue.songs.splice(1, 0, song);
        if (skipCurrent)
            serverQueue.player.stop();
        return musicUtils.songEmbed("Sigue", song, 0);
    }
}
async function playskip(discord_message, args) {
    return playtop(discord_message, args, true);
}
async function shuffle(discord_message, _args) {
    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";
    let songs = serverQueue.songs.slice(1);
    songs = (0, utilities_1.shuffleArray)(songs);
    songs.unshift(serverQueue.songs[0]);
    serverQueue.songs = songs;
    return "Shuffled 😩👌";
}
async function volume(discord_message, args) {
    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";
    if (!args[0]) {
        return `Volume: ${musicUtils.getVolume(serverQueue.songs[0].url)}`;
    }
    let volume = parseInt(args[0]);
    if (isNaN(volume))
        return "No mames eso no es un número";
    if (volume < 0)
        volume = 0;
    if (volume > 10) {
        return "No creo que eso sea una buena idea";
    }
    musicUtils.setVolume(serverQueue.songs[0].url, volume);
    serverQueue.currentTrack.volume.setVolumeLogarithmic(volume / 5);
}
async function nowPlaying(discord_message, _args) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";
    //get song and send fancy embed
    const np = serverQueue.songs[0];
    // get time and format it accordingly
    let time = serverQueue.currentTrack.playbackDuration;
    return musicUtils.songEmbed("Now playing", np, time);
}
async function queue(discord_message, _args) {
    const serverQueue = globalQueues.get(discord_message.guild?.id);
    if (!serverQueue?.songs) {
        return "No hay ni madres aqui";
    }
    let queue_idx = 0;
    let sent = await discord_message.channel.send(musicUtils.queueEmbedMessage(serverQueue.songs, queue_idx));
    const collector = discord_message.channel.createMessageComponentCollector({ time: 15000 });
    collector.on('collect', async (interaction) => {
        if (interaction.message.id !== sent.id)
            return;
        collector.resetTimer();
        if (interaction.customId == musicUtils.INTERACTION_PREV_ID) {
            queue_idx -= musicUtils.QUEUE_PAGE_SIZE;
        }
        if (interaction.customId == musicUtils.INTERACTION_NEXT_ID) {
            queue_idx += musicUtils.QUEUE_PAGE_SIZE;
        }
        const updatedMessage = musicUtils.queueEmbedMessage(serverQueue.songs, queue_idx);
        await interaction.update({
            embeds: updatedMessage.embeds,
            components: updatedMessage.components,
        });
    });
    collector.once("end", async (collection) => {
        await sent.edit({ components: [] });
        collector.stop();
    });
}
async function loop(discord_message, args) {
    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    serverQueue.loop = !serverQueue.loop;
    if (serverQueue.loop)
        return "Loop-the-loop";
    else
        return "No more loop";
}
async function lastPlayed(discord_message, args) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";
    // send last played embed
    const lp = serverQueue.lastPlayed;
    return musicUtils.songEmbed("Last played", lp, 0);
}
// TODO: some major refactor + making this part of a singleton of sorts
function GetAgent() {
    if (!ytdlAgent) {
        let cookie = null;
        if (process.env.YT_COOKIE_JSON) {
            cookie = JSON.parse(process.env.YT_COOKIE_JSON);
        }
        ytdlAgent = ytdl_core_1.default.createAgent(cookie);
    }
    return ytdlAgent;
}
