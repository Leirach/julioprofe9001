"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueContract = void 0;
//TODO: Miove functionality from music.ts to this class
class QueueContract {
    constructor(discord_message, voiceChannel) {
        this.textChannel = discord_message.channel;
        this.voiceChannel = voiceChannel;
        this.connection = null;
        this.player = null;
        this.currentTrack = null;
        this.songs = Array();
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
exports.QueueContract = QueueContract;
