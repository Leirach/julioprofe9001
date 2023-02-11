import { Client, ClientOptions, Intents } from "discord.js";

export class Bot extends Client {
    private static instance: Bot;

    constructor(options: ClientOptions) {
        super(options);
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new Bot({
                intents: [
                    Intents.FLAGS.GUILDS,
                    Intents.FLAGS.DIRECT_MESSAGES,
                    Intents.FLAGS.GUILD_MESSAGES,
                    Intents.FLAGS.GUILD_VOICE_STATES,
                    Intents.FLAGS.GUILD_MEMBERS,
                    Intents.FLAGS.GUILD_PRESENCES
                ],
            });
        }
        return this.instance;
    }
}