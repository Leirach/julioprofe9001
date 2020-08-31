"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueContract = exports.Song = void 0;
class Song {
    constructor(title = "", url, duration, thumbnail) {
        this.title = title;
        this.url = url;
        this.duration = duration;
        this.thumbnail = thumbnail;
    }
}
exports.Song = Song;
class QueueContract {
    constructor(discord_message, voiceChannel) {
        this.textChannel = discord_message.channel;
        this.voiceChannel = voiceChannel;
        this.connection = null;
        this.songs = Array();
        this.playing = true;
        this.loop = false;
    }
}
exports.QueueContract = QueueContract;
