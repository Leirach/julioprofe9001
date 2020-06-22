import { Message, Collection, Guild } from "discord.js";
import { QueueContruct, GlobalQueue } from './musicClasses';
import ytdl from 'ytdl-core';

let globalQueues = new Collection<string, QueueContruct>();

type FunctionDictionary = { [key: string]: Function };
export let musicCommands: FunctionDictionary = {
    "play": play,
}

/**
 * Plays music?
 * @param discord_message 
 * @param _args 
 */
async function play(discord_message: Message, _args: string[]) {
    const args = discord_message.content.split(" ");

    const voiceChannel = discord_message.member.voice.channel;
    if (!voiceChannel)
        return "You need to be in a voice channel to play music!"
    const permissions = voiceChannel.permissionsFor("312665173053931520");
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return "I need the permissions to join and speak in your voice channel!"
    }
    let song = {
        title: "",
        url: ""
    }
    try {
        let songInfo = await ytdl.getInfo(args[1]);
        song.title = songInfo.title;
        song.url = songInfo.video_url;
    } catch (err) {
        return "No mames, eso no es un link";
    }

    let serverQueue = globalQueues.get(discord_message.guild.id);
    if (serverQueue) {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return `${song.title} agregado a la playlist`;
    }

    let queue = new QueueContruct(discord_message, voiceChannel);

    // Setting the queue using our contract
    globalQueues.set(discord_message.guild.id, queue);
    // Pushing the song to our songs array
    queue.songs.push(song);

    try {
        // Here we try to join the voicechat and save our connection into our object.
        var connection = await voiceChannel.join();
        queue.connection = connection;
        // Calling the play function to start a song
        playSong(discord_message.guild, queue.songs[0]);
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
    .on("error", (error: Error) => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}