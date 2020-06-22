import { Message, VoiceConnection, TextChannel, VoiceChannel, DMChannel, NewsChannel, Collection} from "discord.js";

export class QueueContruct {
    textChannel: TextChannel | DMChannel | NewsChannel;
    voiceChannel: VoiceChannel;
    connection: VoiceConnection| null;
    songs: Array<any>;
    volume: number;
    playing: boolean;

    constructor(discord_message: Message, voiceChannel: VoiceChannel) {
        this.textChannel = discord_message.channel;
        this.voiceChannel = voiceChannel;
        this.connection = null;
        this.songs = [];
        this.volume = 5;
        this.playing = true;
    }
}

export type GlobalQueue = Collection<string, QueueContruct>;