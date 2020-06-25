import { Message, VoiceConnection, TextChannel, VoiceChannel, DMChannel, 
         NewsChannel, Collection} from "discord.js";

export class Song {
    title: string;
    url: string;
    duration: string;
    constructor(title: string = "", url: string, duration: string) {
        this.title = title;
        this.url = url;
        this.duration = duration
    }
}

export class QueueContract {
    textChannel: TextChannel | DMChannel | NewsChannel;
    voiceChannel: VoiceChannel;
    connection: VoiceConnection| null;
    songs: Array<Song>;
    volume: number;
    playing: boolean;
    loop: boolean;

    constructor(discord_message: Message, voiceChannel: VoiceChannel) {
        this.textChannel = discord_message.channel;
        this.voiceChannel = voiceChannel;
        this.connection = null;
        this.songs = Array<Song>();
        this.volume = 5;
        this.playing = true;
        this.loop = false;
    }
}

// no jala esto por alguna razon
export type GlobalQueue = Collection<string, QueueContract>;