import { EventEmitter } from 'node:events';

export class QueueEventEmitter {
    private static instance: QueueEventEmitter;

    private eventEmitter = new EventEmitter();

    public static getInstance(): QueueEventEmitter {
        if (!QueueEventEmitter.instance) {
            QueueEventEmitter.instance = new QueueEventEmitter();
        }
        return QueueEventEmitter.instance;
    }

    emitPlaylistLoaded(guildId: string) {
        this.eventEmitter.emit('loaded', guildId);
    }

    oncePlaylistLoaded(fn: (guildId: string) => void) {
        this.eventEmitter.once("loaded", fn);
    }
}
