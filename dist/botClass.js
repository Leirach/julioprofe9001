"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const discord_js_1 = require("discord.js");
class Bot extends discord_js_1.Client {
    constructor(options) {
        super(options);
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new Bot({
                intents: [
                    discord_js_1.GatewayIntentBits.Guilds,
                    discord_js_1.GatewayIntentBits.DirectMessages,
                    discord_js_1.GatewayIntentBits.MessageContent,
                    discord_js_1.GatewayIntentBits.GuildMessages,
                    discord_js_1.GatewayIntentBits.GuildVoiceStates,
                    discord_js_1.GatewayIntentBits.GuildMembers,
                    discord_js_1.GatewayIntentBits.GuildPresences,
                ],
            });
        }
        return this.instance;
    }
}
exports.Bot = Bot;
