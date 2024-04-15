"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueContract = void 0;
const lodash_1 = require("lodash");
const queueEventEmitter_1 = require("./queueEventEmitter");
//TODO: Miove functionality from music.ts to this class
const queueEventEmitter = queueEventEmitter_1.QueueEventEmitter.getInstance();
class QueueContract {
    constructor(discord_message, voiceChannel) {
        this.id = voiceChannel.id;
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
    shufflePlaylist() {
        this.songs = (0, lodash_1.shuffle)(this.songs); // shuffle initial batch
        queueEventEmitter.oncePlaylistLoaded(() => {
            this.songs = [this.songs[0], ...(0, lodash_1.shuffle)(this.songs)];
        });
    }
}
exports.QueueContract = QueueContract;
