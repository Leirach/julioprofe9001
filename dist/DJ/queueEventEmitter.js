"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueEventEmitter = void 0;
const node_events_1 = require("node:events");
class QueueEventEmitter {
    constructor() {
        this.eventEmitter = new node_events_1.EventEmitter();
    }
    static getInstance() {
        if (!QueueEventEmitter.instance) {
            QueueEventEmitter.instance = new QueueEventEmitter();
        }
        return QueueEventEmitter.instance;
    }
    emitPlaylistLoaded(guildId) {
        this.eventEmitter.emit('loaded', guildId);
    }
    oncePlaylistLoaded(fn) {
        this.eventEmitter.once("loaded", fn);
    }
}
exports.QueueEventEmitter = QueueEventEmitter;
