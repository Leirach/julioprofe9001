import { Client, ClientOptions, GatewayIntentBits  } from "discord.js";

export class Bot extends Client {
    private static instance: Bot;

    constructor(options: ClientOptions) {
        super(options);
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new Bot({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.DirectMessages,
                    GatewayIntentBits.MessageContent,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.GuildVoiceStates,
                    GatewayIntentBits.GuildMembers,
                    GatewayIntentBits.GuildPresences,
                ],
            });
        }
        return this.instance;
    }
}