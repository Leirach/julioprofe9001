"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueContract = exports.Song = void 0;
class Song {
    constructor(title = "", url, duration, thumbnail, author) {
        this.title = title;
        this.url = url;
        this.duration = duration;
        this.thumbnail = thumbnail;
        this.author = author;
    }
}
exports.Song = Song;
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
        this.player.off('stateChange', () => { });
        this.songs = [];
        this.player.stop();
        this.connection.destroy();
    }
}
exports.QueueContract = QueueContract;
