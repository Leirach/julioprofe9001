import Collection from "@discordjs/collection";
import { QueueContract } from "./musicClasses";
import { VoiceStatusEventEmitter } from './voiceChannelEvents'

const DISCONNECT_TIMEOUT = 1000;

export class GlobalQueueManager {
    private static instance: GlobalQueueManager;

    private queueMap = new Collection<string, QueueContract>();
    private timeoutMap: {[key:string]: NodeJS.Timeout} = {};
    private voiceStatus = VoiceStatusEventEmitter.getInstance();

    private constructor() {
        this.voiceStatus.onEmpty(this.onGuildEmpty.bind(this));
        this.voiceStatus.onJoined(this.onRejoined.bind(this));
    }

    public static getInstance(): GlobalQueueManager {
        if (!GlobalQueueManager.instance) {
            GlobalQueueManager.instance = new GlobalQueueManager();
        }

        return GlobalQueueManager.instance;
    }

    onGuildEmpty(guildId: string) {
        const contract = this.queueMap.get(guildId);
        if (!contract) return;

        const timeout = setTimeout(() => {
            contract.disconnect();
            this.queueMap.delete(guildId);
        }, DISCONNECT_TIMEOUT);

        this.timeoutMap[guildId] = timeout;
    }

    onRejoined(guildId: string) {
        const timeout = this.timeoutMap[guildId];
        clearTimeout(timeout);
    }

    get(key: string) {
        return this.queueMap.get(key);
    }

    set(key: string, contract: QueueContract) {

        return this.queueMap.set(key, contract);
    }

    delete(key: string) {
        return this.queueMap.delete(key);
    }


}