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
                    discord_js_1.Intents.FLAGS.GUILDS,
                    discord_js_1.Intents.FLAGS.DIRECT_MESSAGES,
                    discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
                    discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES,
                    discord_js_1.Intents.FLAGS.GUILD_MEMBERS,
                    discord_js_1.Intents.FLAGS.GUILD_PRESENCES
                ],
            });
        }
        return this.instance;
    }
}
exports.Bot = Bot;
