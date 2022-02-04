import {
    Message, VoiceChannel, Collection, TextBasedChannels
} from "discord.js";

import { AudioPlayer, AudioResource, VoiceConnection } from "@discordjs/voice";

export class Song {
    title: string;
    url: string;
    duration: string;
    thumbnail: string;
    volume: number;
    author: string;

    constructor(title: string = "", url: string, duration: string, thumbnail: string, author: string) {
        this.title = title;
        this.url = url;
        this.duration = duration;
        this.thumbnail = thumbnail;
        this.author = author;
    }
}

export class QueueContract {
    textChannel: TextBasedChannels;
    voiceChannel: VoiceChannel;
    connection: VoiceConnection | null;
    player: AudioPlayer;
    songs: Array<Song>;
    lastPlayed: Song;
    playing: boolean;
    loop: boolean;
    currentTrack: AudioResource;

    constructor(discord_message: Message, voiceChannel: VoiceChannel) {
        this.textChannel = discord_message.channel;
        this.voiceChannel = voiceChannel;
        this.connection = null;
        this.player = null;
        this.currentTrack = null;
        this.songs = Array<Song>();
        this.playing = true;
        this.loop = false;
    }
}

// no jala esto por alguna razon
export type GlobalQueue = Collection<string, QueueContract>;