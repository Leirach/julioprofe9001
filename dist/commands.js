"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
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
    "emojify": emojify,
    "random": pingRandom
};
/**
 * Returns a random copypasta to send
 */
async function copypasta(discord_message, _args) {
    try {
        const res = await axios_1.default.get('https://www.reddit.com/r/copypasta/random.json');
        const title = res.data[0].data.children[0].data.title;
        const text = res.data[0].data.children[0].data.selftext;
        const msg = `**${title}**\n${text}`;
        for (let i = 0; i < msg.length; i += 2000) {
            const chunk = msg.slice(i, i + 2000);
            await discord_message.channel.send(chunk);
        }
    }
    catch (err) {
        console.error(err);
        return "lmao algo salio mal";
    }
}
/**
 * Sends a random reply from the "oraculo" array in replies.json
 */
async function oraculo(discord_message, _args) {
    discord_message.reply(utilities.getRandom(replies_1.replies.oraculo));
}
/**
 * Rolls the corresponding dice to the first argument
 * See https://www.npmjs.com/package/d20 for more info
 */
async function roll(discord_message, args) {
    if (args[0]) {
        try {
            return d20_1.default.roll(args[0]).toString();
        }
        catch (e) {
            return ":(";
        }
    }
    else {
        return "Usage: !roll (dice)";
    }
}
/**
 * SPAGHETTI CODE WARNING
 * Sends people to the purgatory channel, can send multiple people if they are all
 * mentioned in the same message. After 30 seconds returns them to their original
 * voice channel.
 */
//TODO: refactor
async function castigar(discord_message, _args) {
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
        members.push(await discord_message.guild?.members.fetch(user));
    }
    vc = members[0]?.voice.channelId;
    //if member is in voice channel and its not purgatory, send him to the ranch
    if (vc && vc != config_1.config.purgatoryChannel) {
        castigados.push({ "members": members, "vc": vc });
        members.forEach(async (member) => {
            await member?.voice.setChannel(config_1.config.purgatoryChannel, "Castigado");
        });
        if (members.length > 1) {
            discord_message.channel.send("Castigados");
        }
        else {
            discord_message.channel.send("Castigado");
        }
        await utilities.sleep(30);
        //if member hasn't left the purgatory send him back to his original vc
        let aux = castigados.shift();
        let sentBack = 0;
        aux.members.forEach(async (member) => {
            if (member?.voice.channelId == config_1.config.purgatoryChannel) {
                await member?.voice.setChannel(aux.vc);
                sentBack += 1;
            }
        });
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
}
async function emojify(discord_message, args) {
    let original;
    if (discord_message.reference) {
        const ref = await discord_message.fetchReference();
        original = ref.content;
    }
    else if (args.length > 0) {
        original = args.join(' ');
    }
    else {
        return "reply or msg XD";
    }
    let emojified = "";
    for (let char of original.toLowerCase()) {
        const emoji = replies_1.EmojifyMap[char] || char;
        // dont add any more if length exceeds max
        if (emojified.length + emoji.length > 2000)
            break;
        emojified += emoji;
    }
    return emojified;
}
/**
 * Pings random online member
 */
async function pingRandom(discord_message, _args) {
    const guild = discord_message.guild;
    const members = await guild.members.fetch();
    var online = members.filter(m => m.presence?.status == "online");
    return `<@${online.random().user.id}>`;
}
