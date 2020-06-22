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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
const discord_js_1 = require("discord.js");
/**
 * Command functions for the bot, keywords for commands are preceded by '!'.
 * Any message that needs to be sent and is not a reply can must be returned by
 * the function. Embeds can be return as long as it can be sent via the
 * channel.send() function.
 */
const d20_1 = __importDefault(require("d20"));
const config_json_1 = __importDefault(require("./config.json"));
const replies_1 = require("./replies");
const utilities = __importStar(require("./utilities"));
var copypastas = utilities.loadCopypastas(config_json_1.default.cp_files);
var castigados = [];
exports.commands = {
    "copypasta": copypasta,
    "oraculo": oraculo,
    "play": play,
    "roll": roll,
    "castigar": castigar,
};
/**
 * Returns a random copypasta to send
 * @param discord_message
 * @param _args
 */
function copypasta(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        return utilities.getRandom(copypastas);
    });
}
/**
 * 20% chance to send music meme or random reply from the "cumbia" array in replies.json
 * @param discord_message
 * @param _args
 */
function play(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (utilities.randBool(.2)) {
            return utilities.getRandom(replies_1.replies.cumbia);
        }
        else if (utilities.randBool(.2)) {
            const exampleEmbed = new discord_js_1.MessageEmbed()
                .setAuthor('Now Playing♪', 'https://images-ext-2.discordapp.net/external/2fG56UtfyTSowWQ6HhhPIV9VrZoD_OcVdHVwWpu6rIY/https/rythmbot.co/rythm.gif', 'https://chtm.joto')
                .setDescription("Cumbia Poder\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬\n\n04:20/05:69\n\nRequested by: Sero4")
                .setThumbnail('https://is4-ssl.mzstatic.com/image/thumb/Music/v4/46/aa/43/46aa4332-829b-84e6-9605-c6e183f6ca36/source/1200x1200bb.jpg');
            discord_message.channel.send(exampleEmbed);
        }
        return null;
    });
}
/**
 * Sends a random reply from the "oraculo" array in replies.json
 * @param {message} discord_message
 * @param {[String]} args
 */
function oraculo(discord_message, _args) {
    return __awaiter(this, void 0, void 0, function* () {
        discord_message.reply(utilities.getRandom(replies_1.replies.oraculo));
        return null;
    });
}
/**
 * Rolls the corresponding dice to the first argument
 * See https://www.npmjs.com/package/d20 for more info
 * @param discord_message
 * @param args
 */
function roll(discord_message, args) {
    return __awaiter(this, void 0, void 0, function* () {
        if (args[0]) {
            return d20_1.default.roll(args[0]); // TODO: error checking
        }
        else {
            return "Usage: !roll (dice)";
        }
    });
}
/**
 * SPAGHETTI CODE WARNING
 * NEED TO REDO ASAP
 * Sends people to the purgatory channel, can send multiple people if they are all
 * mentioned in the same message. After 30 seconds returns them to their original
 * voice channel.
 * @param discord_message
 * @param _args
 */
function castigar(discord_message, _args) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const users = discord_message.mentions.users.array();
        let members = [];
        let vc;
        if (!users) {
            return "Usage: !castigar @wey";
        }
        if (!discord_message.guild) {
            return "Aqui no uei";
        }
        users.forEach(user => {
            var _a;
            members.push((_a = discord_message.guild) === null || _a === void 0 ? void 0 : _a.member(user));
        });
        vc = (_a = members[0]) === null || _a === void 0 ? void 0 : _a.voice.channelID;
        //if member is in voice channel and its not purgatory, send him to the ranch
        if (vc && vc != config_json_1.default.purgatoryChannel) {
            castigados.push({ "members": members, "vc": vc });
            members.forEach((member) => __awaiter(this, void 0, void 0, function* () {
                yield (member === null || member === void 0 ? void 0 : member.voice.setChannel(config_json_1.default.purgatoryChannel, "Castigado"));
            }));
            if (members.length > 1) {
                discord_message.channel.send("Castigados, papu");
            }
            else {
                discord_message.channel.send("Castigado, papu");
            }
            yield utilities.sleep(30);
            //if member hasn't left the purgatory send him back to his original vc
            let aux = castigados.shift();
            let sentBack = 0;
            aux.members.forEach((member) => __awaiter(this, void 0, void 0, function* () {
                if ((member === null || member === void 0 ? void 0 : member.voice.channelID) == config_json_1.default.purgatoryChannel) {
                    yield (member === null || member === void 0 ? void 0 : member.voice.setChannel(aux.vc));
                    sentBack += 1;
                }
            }));
            if (sentBack > 1) {
                discord_message.channel.send("Descastigados, papu");
            }
            else {
                discord_message.channel.send("Descastigado, papu");
            }
            return null;
        }
        else {
            return "No esté chingando";
        }
    });
}
