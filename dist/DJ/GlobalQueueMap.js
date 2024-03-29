"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalQueueManager = void 0;
const voiceChannelEvents_1 = require("./voiceChannelEvents");
const DISCONNECT_TIMEOUT = 1000;
class GlobalQueueManager {
    constructor() {
        this.queueMap = new Map();
        this.timeoutMap = {};
        this.voiceStatus = voiceChannelEvents_1.VoiceStatusEventEmitter.getInstance();
        this.voiceStatus.onEmpty(this.onGuildEmpty.bind(this));
        this.voiceStatus.onJoined(this.onRejoined.bind(this));
    }
    static getInstance() {
        if (!GlobalQueueManager.instance) {
            GlobalQueueManager.instance = new GlobalQueueManager();
        }
        return GlobalQueueManager.instance;
    }
    onGuildEmpty(guildId) {
        const contract = this.queueMap.get(guildId);
        if (!contract)
            return;
        const timeout = setTimeout(() => {
            contract.disconnect();
            this.queueMap.delete(guildId);
        }, DISCONNECT_TIMEOUT);
        this.timeoutMap[guildId] = timeout;
    }
    onRejoined(guildId) {
        const timeout = this.timeoutMap[guildId];
        clearTimeout(timeout);
    }
    get(key) {
        return this.queueMap.get(key);
    }
    set(key, contract) {
        return this.queueMap.set(key, contract);
    }
    delete(key) {
        return this.queueMap.delete(key);
    }
}
exports.GlobalQueueManager = GlobalQueueManager;
