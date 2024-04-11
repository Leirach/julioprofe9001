import { Message, VoiceChannel, TextChannel } from "discord.js";
import { AudioPlayer, AudioResource, PlayerSubscription, VoiceConnection } from "@discordjs/voice";
import { Song } from "./song";

//TODO: Miove functionality from music.ts to this class

export class QueueContract {
    textChannel: TextChannel;
    voiceChannel: VoiceChannel;
    connection: VoiceConnection | null;
    player: AudioPlayer;
    songs: Array<Song>;
    lastPlayed: Song;
    playing: boolean;
    loop: boolean;
    currentTrack: AudioResource;
    subscription: PlayerSubscription;

    constructor(discord_message: Message, voiceChannel: VoiceChannel) {
        this.textChannel = discord_message.channel as TextChannel;
        this.voiceChannel = voiceChannel;
        this.connection = null;
        this.player = null;
        this.currentTrack = null;
        this.songs = Array<Song>();
        this.playing = true;
        this.loop = false;
    }

    disconnect() {
        this.player.removeAllListeners('stateChange');
        this.songs = [];
        this.player.stop();
        this.subscription.unsubscribe();
        this.connection.disconnect();
        this.connection.destroy();
    }
}
