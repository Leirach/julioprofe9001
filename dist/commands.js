"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
/**
 * Command functions for the bot, keywords for commands are preceded by '!'.
 * Any message that needs to be sent and is not a reply can must be returned by
 * the function. Embeds can be return as long as it can be sent via the
 * channel.send() function.
 */
const discord_js_1 = require("discord.js");
const d20_1 = __importDefault(require("d20"));
;
const config_1 = require("./config");
const replies_1 = require("./replies");
const utilities = __importStar(require("./utilities"));
const axios_1 = __importDefault(require("axios"));
var castigados = [];
exports.commands = {
    "copypasta": copypasta,
    "oraculo": oraculo,
    "roll": roll,
    "castigar": castigar,
};
/**
 * Returns a random copypasta to send
 */
function copypasta(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield axios_1.default.get('https://www.reddit.com/r/copypasta/random.json');
            const title = res.data[0].data.children[0].data.title;
            const text = res.data[0].data.children[0].data.selftext;
            const msg = `**${title}**\n${text}`;
            for (let i = 0; i < msg.length; i += 2000) {
                const chunk = msg.slice(i, i + 2000);
                yield discord_message.channel.send(chunk);
            }
        }
        catch (err) {
            console.error(err);
            return "lmao algo salio mal";
        }
    });
}
/**
 * @deprecated
 * good meme, stays here
 * 20% chance to send music meme or random reply from the "cumbia" array in replies.json
 */
function playMeme(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (utilities.randBool(.2)) {
            return utilities.getRandom(replies_1.replies.cumbia);
        }
        else if (utilities.randBool(.2)) {
            const embed = new discord_js_1.MessageEmbed()
                .setAuthor('Now Playing♪', 'https://images-ext-2.discordapp.net/external/2fG56UtfyTSowWQ6HhhPIV9VrZoD_OcVdHVwWpu6rIY/https/rythmbot.co/rythm.gif', 'https://chtm.joto')
                .setDescription("Cumbia Poder\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬\n\n04:20/05:69\n\nRequested by: Sero4")
                .setThumbnail('https://is4-ssl.mzstatic.com/image/thumb/Music/v4/46/aa/43/46aa4332-829b-84e6-9605-c6e183f6ca36/source/1200x1200bb.jpg');
            return {
                embeds: [embed]
            };
        }
    });
}
/**
 * Sends a random reply from the "oraculo" array in replies.json
 */
function oraculo(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        discord_message.reply(utilities.getRandom(replies_1.replies.oraculo));
    });
}
/**
 * Rolls the corresponding dice to the first argument
 * See https://www.npmjs.com/package/d20 for more info
 */
function roll(discord_message, args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (args[0]) {
            return d20_1.default.roll(args[0]).toString();
        }
        else {
            return "Usage: !roll (dice)";
        }
    });
}
/**
 * SPAGHETTI CODE WARNING
 * Sends people to the purgatory channel, can send multiple people if they are all
 * mentioned in the same message. After 30 seconds returns them to their original
 * voice channel.
 */
function castigar(discord_message, _args) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const users = discord_message.mentions.users.toJSON();
        let members = [];
        let vc;
        if (!users) {
            return "Usage: !castigar @wey";
        }
        if (!discord_message.guild) {
            return "Aqui no uei";
        }
        for (let user of users) {
            members.push(yield ((_a = discord_message.guild) === null || _a === void 0 ? void 0 : _a.members.fetch(user)));
        }
        vc = (_b = members[0]) === null || _b === void 0 ? void 0 : _b.voice.channelId;
        //if member is in voice channel and its not purgatory, send him to the ranch
        if (vc && vc != config_1.config.purgatoryChannel) {
            castigados.push({ "members": members, "vc": vc });
            members.forEach((member) => __awaiter(this, void 0, void 0, function* () {
                yield (member === null || member === void 0 ? void 0 : member.voice.setChannel(config_1.config.purgatoryChannel, "Castigado"));
            }));
            if (members.length > 1) {
                discord_message.channel.send("Castigados");
            }
            else {
                discord_message.channel.send("Castigado");
            }
            yield utilities.sleep(30);
            //if member hasn't left the purgatory send him back to his original vc
            let aux = castigados.shift();
            let sentBack = 0;
            aux.members.forEach((member) => __awaiter(this, void 0, void 0, function* () {
                if ((member === null || member === void 0 ? void 0 : member.voice.channelId) == config_1.config.purgatoryChannel) {
                    yield (member === null || member === void 0 ? void 0 : member.voice.setChannel(aux.vc));
                    sentBack += 1;
                }
            }));
            if (sentBack > 1) {
                discord_message.channel.send("Descastigados");
            }
            else {
                discord_message.channel.send("Descastigado");
            }
            return null;
        }
        else {
            return "No esté chingando";
        }
    });
}
