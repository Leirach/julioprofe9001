import { Message, Collection, Guild } from "discord.js";
import ytdl from 'ytdl-core';
import { QueueContract, Song } from './musicClasses';
import * as ytUitls from './youtubeUtils';
import { isURL } from "../utilities";

let globalQueues = new Collection<string, QueueContract>();

type FunctionDictionary = { [key: string]: Function };
export let musicCommands: FunctionDictionary = {
    "play": play,
    "queue": queue,
    "skip": skip,
    "stop": stop,
    "dc": stop,
}

/**
 * Plays music?
 * @param discord_message 
 * @param args 
 */
async function play(discord_message: Message, args: string[]) {
    const voiceChannel = discord_message.member.voice.channel;
    if (!voiceChannel)
        return "No estás conectado en vc";
    const permissions = voiceChannel.permissionsFor("312665173053931520");
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return "Necesito permisos para conectar en ese canal";
    }

    // tries to parse url
    let result;
    if ( isURL(args[0]) ) {
        result = await ytUitls.getSongs(args[0]);
        console.log(result);
    }
    else {
        result = await ytUitls.searchYT(args[0])
    }

    //if a queueContract already exists (bot is already playing a song)
    // push a song in the array and return confirmation message
    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (serverQueue){
        // if its a song push it, otherwise concat the whole fucking array
        if (result instanceof Song){
            serverQueue.songs.push(result);
            return `**${result.title}** agregado a la playlist`;
        }
        else {
            serverQueue.songs.concat(result);
            return `Agregads un chingo de canciones`;
        }
        
    }

    // Otherwise create new contract and start playing music boi
    serverQueue = new QueueContract(discord_message, voiceChannel);
    globalQueues.set(discord_message.guild.id, serverQueue);
    if (result instanceof Song)
            serverQueue.songs.push(result);
        else 
            serverQueue.songs.concat(result);
    try {
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
        return ;
    }

    const dispatcher = serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
        serverQueue.songs.shift();
        playSong(guild, serverQueue.songs[0]);
    })
    .on("error", (error: Error) => {
        console.error(error)
    });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    //serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

async function queue(discord_message: Message, _args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild?.id);
    if (!serverQueue || !serverQueue.songs) {
        return "No hay ni madres aqui";
    }

    const next10 = serverQueue.songs.slice(0, 11);
    let msg = `Now playing: ${next10[0]}\nUp Next:\n`;
    next10.forEach( (song, idx) =>{
        if (idx > 0) {
            msg.concat(`${idx}: ${song.title}\n`);
        }
    });
    return msg;
}

function skip(discord_message: Message, _args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return "Ni estoy tocando música";
    if (!discord_message.member.voice.channel)
        return "No mames, ni la estás oyendo";
    serverQueue.connection.dispatcher.end();
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

function playtop(discord_message: Message, _args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return play(discord_message, _args);
}

function playskip(discord_message: Message, _args: string[]) {
    const serverQueue = globalQueues.get(discord_message.guild.id);
    if (!serverQueue)
        return play(discord_message, _args);
    //serverQueue.songs.splice(1, 0, item);
    serverQueue.connection.dispatcher.end();
}

function shuffle(discord_message: Message, _args: string[]) {

}
