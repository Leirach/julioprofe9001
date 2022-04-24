import { EventEmitter } from 'events';

export class VoiceStatusEventEmitter {
    private static instance: VoiceStatusEventEmitter;

    private eventEmitter = new EventEmitter();

    public static getInstance(): VoiceStatusEventEmitter {
        if (!VoiceStatusEventEmitter.instance) {
            VoiceStatusEventEmitter.instance = new VoiceStatusEventEmitter();
        }

        return VoiceStatusEventEmitter.instance;
    }

    emitEmpty(guildId: string) {
        this.eventEmitter.emit('empty', guildId);
    }

    emitJoined(guildId: string) {
        this.eventEmitter.emit('joined', guildId);
    }

    onEmpty(fn: (guildId: string) => void) {
        this.eventEmitter.on("empty", fn);
    }

    onJoined(fn: (guildId: string) => void) {
        this.eventEmitter.on("joined", fn);
    }
}
