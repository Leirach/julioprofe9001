import { Message, Guild, EmbedBuilder, VoiceChannel, PermissionFlagsBits, TextChannel, MessageCreateOptions, MessagePayload, MessageTarget, InteractionUpdateOptions } from "discord.js";
import { joinVoiceChannel, createAudioResource, createAudioPlayer } from '@discordjs/voice';
import ytdl from 'ytdl-core';
import { QueueContract, Song } from './musicClasses';
import * as ytUitls from './youtubeUtils';
import { isURL, shuffleArray } from "../utilities";
import { config } from '../config'
import { GlobalQueueManager } from "./GlobalQueueMap";
import { Bot } from "../botClass";

//TODO: separate file into different commands/utils or something else

const bufferSize = 1 << 25;

let globalQueues = GlobalQueueManager.getInstance();

type FunctionDictionary = { [key: string]: (...args: any) => Promise<MessageCreateOptions | string> };
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
    "prev": lastPlayed,
    "lp": lastPlayed,
}

async function preloadPlaylist(discord_message: Message, args: string[]) {
    try {
        await ytUitls.cachePlaylist(true);
    } catch (err) {
        return `Lmao la cagué: ${err}`;
    }
    return "Big pp, done."
}

async function playlist(discord_message: Message, args: string[]) {
    return await play(discord_message, [config.playlist], true);
}

/**
 * Plays music!
 */
async function play(discord_message: Message, args: string[], preshuffle?: boolean): Promise<MessageCreateOptions | string> {
    const bot = Bot.getInstance();
    const voiceChannel = discord_message.member.voice.channel;
    if (!voiceChannel)
        return "No estás conectado en vc";
    const permissions = voiceChannel.permissionsFor(bot.user.id);
    if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
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
        result = await ytUitls.searchYT(args.join(' '));
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
            // TODO: preshuffle and handle arrays better
            if (preshuffle) result = shuffleArray(result);
            serverQueue.songs = serverQueue.songs.concat(result);
            return `Agregadas un chingo de canciones`;
        }
    }

    // Otherwise create new contract and start playing music boi
    serverQueue = new QueueContract(discord_message, voiceChannel as VoiceChannel);
    globalQueues.set(discord_message.guild.id, serverQueue);

    if (result instanceof Song) {
        serverQueue.songs.push(result);
    }
    else {
        // TODO: preshuffle and handle arrays better (same as above)
        if (preshuffle) result = shuffleArray(result);
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
        serverQueue.connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });
        playSong(discord_message.guild, serverQueue.songs[0]);
    } catch (err) {
        console.log(err);
        globalQueues.delete(discord_message.guild.id);
        return "Lmao no me pude conectar"
    }
}
// TODO: better logs here
function playSong(guild: Guild, song: any) {
    const serverQueue = globalQueues.get(guild.id);
    if (!song) {
        serverQueue.subscription.unsubscribe();
        serverQueue.connection.destroy();
        globalQueues.delete(guild.id);
        return;
    }

    var requestOptions = process.env.YT_COOKIE ? {
        headers: {
            cookie: process.env.YT_COOKIE
        }
    } : {};

    // Help, im only supposed to increase this param in ytdl and i dont even know why
    // { highWaterMark: 1024 * 1024 * 10 } // 10mb buffer, supposedly
    const stream = ytdl(song.url, {
        filter: 'audioonly',
        highWaterMark: bufferSize,
        requestOptions: requestOptions
    });

    serverQueue.currentTrack = createAudioResource(stream, { inlineVolume: true });
    let vol = ytUitls.getVolume(song.url);
    serverQueue.currentTrack.volume.setVolumeLogarithmic(vol / 5);

    if (!serverQueue.player) {
        serverQueue.player = createAudioPlayer();
        serverQueue.subscription = serverQueue.connection.subscribe(serverQueue.player);

        serverQueue.player.on("stateChange", (oldState, newState) => {
            console.log("Status: " + newState.status);
            if (serverQueue.currentTrack.ended) {
                if (!serverQueue.loop)
                    serverQueue.lastPlayed = serverQueue.songs.shift();
                playSong(guild, serverQueue.songs[0]);
            }
        })
            .on("error", (error: any) => {
                console.error(error);
                let np = serverQueue.songs.shift();
                let embed = new EmbedBuilder()
                    .setAuthor({ name: "No se puede reproducir:", url: config.avatarUrl })
                    .setTitle(np.title)
                    .setURL(np.url)
                    .setDescription(`Razon: ${error.message}`)
                    .setThumbnail(config.errorImg)
                    .setImage(np.thumbnail);
                serverQueue.textChannel.send({ embeds: [embed] });
                playSong(guild, serverQueue.songs[0]);
            });
    }

    serverQueue.player.play(serverQueue.currentTrack);
}

async function skip(discord_message: Message, _args: string[]): Promise<string> {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return "Ni estoy tocando música";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    const looping = serverQueue.loop;
    serverQueue.loop = false;

    serverQueue.player.stop()
    serverQueue.loop = looping;
}

async function stop(discord_message: Message, _args: string[]): Promise<string> {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return "Ni estoy tocando música";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    serverQueue.songs = [];
    serverQueue.player.stop();
}

// TODO: better returns here
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
        serverQueue.player.stop();
    }
    return reply;
}

async function shuffle(discord_message: Message, _args: string[]): Promise<string> {
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
    serverQueue.currentTrack.volume.setVolumeLogarithmic(volume / 5);
}

async function nowPlaying(discord_message: Message, _args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";

    //get song and send fancy embed
    const np = serverQueue.songs[0];
    // get time and format it accordingly
    let time = serverQueue.currentTrack.playbackDuration;
    return ytUitls.songEmbed("Now playing", np, time);
}

async function queue(discord_message: Message, _args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild?.id);
    if (!serverQueue?.songs) {
        return "No hay ni madres aqui";
    }

    let queue_idx = 0;
    let sent = await (discord_message.channel as TextChannel).send(ytUitls.queueEmbedMessage(serverQueue.songs, queue_idx));

    const collector = (discord_message.channel as TextChannel).createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async interaction => {
        if (interaction.message.id !== sent.id) return;
        collector.resetTimer();
        if (interaction.customId == ytUitls.INTERACTION_PREV_ID) {
            queue_idx -= ytUitls.QUEUE_PAGE_SIZE;
        }
        if (interaction.customId == ytUitls.INTERACTION_NEXT_ID) {
            queue_idx += ytUitls.QUEUE_PAGE_SIZE;
        }

        const updatedMessage = ytUitls.queueEmbedMessage(serverQueue.songs, queue_idx);
        await interaction.update({
            embeds: updatedMessage.embeds,
            components: updatedMessage.components,
        });
    });

    collector.once("end", async collection => {
        await sent.edit({ components: [] });
        collector.stop();
    });
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

async function lastPlayed(discord_message: Message, args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue?.songs)
        return "No hay ni madres aquí";

    // send last played embed
    const lp = serverQueue.lastPlayed;
    return ytUitls.songEmbed("Last played", lp, 0);
}
