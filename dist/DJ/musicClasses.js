"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueContract = exports.Song = void 0;
class Song {
    constructor(title = "", url, duration) {
        this.title = title;
        this.url = url;
        this.duration = duration;
    }
}
exports.Song = Song;
class QueueContract {
    constructor(discord_message, voiceChannel) {
        this.textChannel = discord_message.channel;
        this.voiceChannel = voiceChannel;
        this.connection = null;
        this.songs = Array();
        this.volume = 5;
        this.playing = true;
        this.loop = false;
    }
}
exports.QueueContract = QueueContract;
