import { Message, Collection, Guild, MessageEmbed } from "discord.js";
import ytdl from 'ytdl-core';
import { QueueContract, Song } from './musicClasses';
import * as ytUitls from './youtubeUtils';
import { isURL, shuffleArray } from "../utilities";
import * as config from '../config.json'

const bufferSize = 1 << 25;

let globalQueues = new Collection<string, QueueContract>();

type FunctionDictionary = { [key: string]: Function };
export let musicCommands: FunctionDictionary = {
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
}

async function preloadPlaylist(discord_message: Message, args: string[]) {
    try {
        await ytUitls.cachePlaylist(true);
    } catch (err) {
        return `Lmao la cagué: ${err.message}`;
    }
    return "Big pp, done."
}

async function playlist(discord_message: Message, args: string[]) {
    return await play(discord_message, [config.playlist], true);
}

/**
 * Plays music!
 * @param discord_message
 * @param args
 */
async function play(discord_message: Message, args: string[], preshuffle?: boolean) {
    const voiceChannel = discord_message.member.voice.channel;
    if (!voiceChannel)
        return "No estás conectado en vc";
    const permissions = voiceChannel.permissionsFor(config.botID);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return "Necesito permisos para conectar en ese canal";
    }

    // tries to parse url
    let result;
    let sendEmbed: boolean;
    if (isURL(args[0])) {
        result = await ytUitls.getSongs(args[0]);
        sendEmbed = false;
    }
    else {
        if (!args.join(' ')) {
            return "Tocame esta XD";
        }
        result = await ytUitls.searchYT(args.join(' '))
        sendEmbed = true;
    }

    //if a queueContract already exists (bot is already playing a song)
    // push a song in the array and return confirmation message
    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (serverQueue) {
        // if its a song push it, otherwise concat the whole fucking array
        if (result instanceof Song) {
            serverQueue.songs.push(result);
            return sendEmbed ? ytUitls.songEmbed("Agregado", result, 0) : "Yastas";
        }
        else {
            serverQueue.songs = serverQueue.songs.concat(result);
            return `Agregadas un chingo de canciones`;
        }
    }

    // Otherwise create new contract and start playing music boi
    serverQueue = new QueueContract(discord_message, voiceChannel);
    globalQueues.set(discord_message.guild.id, serverQueue);

    if (result instanceof Song) {
        serverQueue.songs.push(result);
    }
    else {
        serverQueue.songs = serverQueue.songs.concat(result);
    }

    // pre shuffle songs form playlist
    if (preshuffle) serverQueue.songs = shuffleArray(serverQueue.songs);

    try {
        const song = serverQueue.songs[0];
        let msg = sendEmbed ? ytUitls.songEmbed("Now Playing", song, 0) : `Now playing: ${song.title}`;
        serverQueue.textChannel.send(msg);
        serverQueue.connection = await voiceChannel.join();
        playSong(discord_message.guild, serverQueue.songs[0]);
    } catch (err) {
        console.log(err);
        globalQueues.delete(discord_message.guild.id);
        return "Lmao no me pude conectar"
    }
}

function playSong(guild: Guild, song: any) {
    const serverQueue = globalQueues.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        globalQueues.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(
            ytdl(song.url, { filter: 'audioonly', highWaterMark: bufferSize })
            // Help, im only supposed to increase this param in ytdl and i dont even know why
            // { highWaterMark: 1024 * 1024 * 10 } // 10mb buffer, supposedly
        ).on("finish", () => {
            if (!serverQueue.loop)
                serverQueue.songs.shift();
            playSong(guild, serverQueue.songs[0]);
        })
        .on("error", (error: Error) => {
            console.error(error);
            let np = serverQueue.songs.shift();
            let embed = new MessageEmbed()
                .setAuthor("No se puede reproducir:", config.avatarUrl)
                .setTitle(np.title)
                .setURL(np.url)
                .setDescription(`Razon: ${error.message}`)
                .setThumbnail(config.errorImg)
                .setImage(np.thumbnail);
            serverQueue.textChannel.send(embed);
            playSong(guild, serverQueue.songs[0]);
        });
    let vol = ytUitls.getVolume(song.url);
    dispatcher.setVolumeLogarithmic(vol / 5);
}

function skip(discord_message: Message, _args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return "Ni estoy tocando música";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    const looping = serverQueue.loop;
    serverQueue.loop = false;
    serverQueue.connection.dispatcher.end();
    serverQueue.loop = looping;
}

function stop(discord_message: Message, _args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return "Ni estoy tocando música";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

async function playtop(discord_message: Message, args: string[], status?: { ok: Boolean }) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!status) status = { ok: false };
    if (!serverQueue) {
        status.ok = false;
        return play(discord_message, args);
    }
    let result;
    let msg;
    if (isURL(args[0])) {
        result = await ytUitls.getSongs(args[0]);
        msg = "Yastas";
        status.ok = true;
    }
    else {
        if (!args.join(' ')) {
            status.ok = false;
            return "Tocame esta XD";
        }
        result = await ytUitls.searchYT(args.join(' '));
        msg = ytUitls.songEmbed("Sigue", result, 0);
        status.ok = true;
    }
    if (!(result instanceof Song)) {
        status.ok = false;
        return "Nel, no puedo agregar playlists";
    }
    serverQueue.songs.splice(1, 0, result);
    status.ok = true;
    return msg;
}

//TODO: bug playskip without arguments and without queue
async function playskip(discord_message: Message, args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    let status = { ok: false };
    let reply = await playtop(discord_message, args, status);
    if (status.ok) {
        serverQueue.connection.dispatcher.end();
    }
    return reply;
}

function shuffle(discord_message: Message, _args: string[]) {
    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";
    let songs = serverQueue.songs.slice(1);
    songs = shuffleArray(songs);
    songs.unshift(serverQueue.songs[0])
    serverQueue.songs = songs;
    return "Shuffled 😩👌";
}

async function volume(discord_message: Message, args: string[]) {
    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";

    if (!args[0]) {
        return `Volume: ${ytUitls.getVolume(serverQueue.songs[0].url)}`
    }

    let volume = parseInt(args[0]);
    if (isNaN(volume))
        return "No mames eso no es un número";

    if (volume < 0) volume = 0;
    if (volume > 10) {
        return "No creo que eso sea una buena idea";
    }
    ytUitls.setVolume(serverQueue.songs[0].url, volume);
    serverQueue.connection.dispatcher.setVolumeLogarithmic(volume / 5);
}

async function nowPlaying(discord_message: Message, _args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";

    //get song and send fancy embed
    const np = serverQueue.songs[0];
    // get time and format it accordingly
    let time = serverQueue.connection.dispatcher.streamTime;
    return ytUitls.songEmbed("Now playing", np, time);
}

async function queue(discord_message: Message, _args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild?.id);
    if (!serverQueue?.songs) {
        return "No hay ni madres aqui";
    }

    const next10 = serverQueue.songs.slice(0, 11);
    var msg = `Now playing: ${next10[0].title}\nUp Next:\n`;
    next10.forEach((song, idx) => {
        if (idx > 0) {
            msg = msg.concat(`${idx}: ${song.title}\n`);
        }
    });
    // console.log(next10.length)
    if (next10.length < 2) {
        msg = msg.concat("Nada XD");
    }
    return msg;
}

async function loop(discord_message: Message, args: string[]) {
    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    serverQueue.loop = !serverQueue.loop;
    if (serverQueue.loop)
        return "Loop-the-loop";
    else
        return "No more loop"
}
