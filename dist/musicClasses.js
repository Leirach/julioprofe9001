"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueContruct = void 0;
class QueueContruct {
    constructor(discord_message, voiceChannel) {
        this.textChannel = discord_message.channel;
        this.voiceChannel = voiceChannel;
        this.connection = null;
        this.songs = [];
        this.volume = 5;
        this.playing = true;
    }
}
exports.QueueContruct = QueueContruct;
