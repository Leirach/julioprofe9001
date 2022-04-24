"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceStatusEventEmitter = void 0;
const events_1 = require("events");
class VoiceStatusEventEmitter {
    constructor() {
        this.eventEmitter = new events_1.EventEmitter();
    }
    static getInstance() {
        if (!VoiceStatusEventEmitter.instance) {
            VoiceStatusEventEmitter.instance = new VoiceStatusEventEmitter();
        }
        return VoiceStatusEventEmitter.instance;
    }
    emitEmpty(guildId) {
        this.eventEmitter.emit('empty', guildId);
    }
    emitJoined(guildId) {
        this.eventEmitter.emit('joined', guildId);
    }
    onEmpty(fn) {
        this.eventEmitter.on("empty", fn);
    }
    onJoined(fn) {
        this.eventEmitter.on("joined", fn);
    }
}
exports.VoiceStatusEventEmitter = VoiceStatusEventEmitter;
