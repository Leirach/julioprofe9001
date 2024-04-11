"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setVolume = exports.getVolume = exports.readVolumes = exports.queueEmbedMessage = exports.songEmbed = exports.QUEUE_PAGE_SIZE = exports.INTERACTION_NEXT_ID = exports.INTERACTION_PREV_ID = void 0;
const luxon_1 = require("luxon");
const config_1 = require("../config");
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const discord_js_1 = require("discord.js");
exports.INTERACTION_PREV_ID = 'queue_prev';
exports.INTERACTION_NEXT_ID = 'queue_next';
exports.QUEUE_PAGE_SIZE = 8;
const volumesCSV = './memes/volumes.csv';
let volumesFile;
let volumes = {};
readVolumes();
function songEmbed(title, song, streamTime) {
    let ltime = luxon_1.Duration.fromMillis(streamTime);
    let tTime = luxon_1.Duration.fromISO(song.duration);
    let format = tTime.as('hours') < 1 ? 'mm:ss' : 'hh:mm:ss';
    let timestamp;
    if (streamTime > 0) {
        timestamp = ltime.toFormat(format) + '/' + tTime.toFormat(format);
    }
    else {
        timestamp = tTime.toFormat(format);
    }
    let embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `${title}:`, iconURL: config_1.config.avatarUrl })
        .setTitle(song.title)
        .setURL(song.url)
        .setThumbnail(config_1.config.avatarUrl)
        .addFields([{ name: song.author, value: `${timestamp} Volume: ${getVolume(song.url)}` }])
        .setImage(song.thumbnail);
    return { embeds: [embed] };
}
exports.songEmbed = songEmbed;
function queueEmbedMessage(queue, start_idx) {
    const end = start_idx + exports.QUEUE_PAGE_SIZE;
    const cur_queue = queue.slice(start_idx, end);
    let embed = new discord_js_1.EmbedBuilder()
        .setAuthor({ name: `Queue`, iconURL: config_1.config.avatarUrl })
        .setTitle(`${start_idx + 1} - ${end} of ${queue.length}:`)
        .setThumbnail(cur_queue[0].thumbnail);
    let description = "";
    cur_queue.forEach(((song, idx) => {
        description += `**${start_idx + idx + 1}. [${song.title}](${song.url})**`;
        description += `${song.author}`;
        if (idx + 1 < exports.QUEUE_PAGE_SIZE) {
            description += "\n\n";
        }
    }));
    embed.setDescription(description);
    return {
        embeds: [embed],
        components: [
            new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(exports.INTERACTION_PREV_ID)
                .setLabel('Prev')
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setDisabled(start_idx == 0), new discord_js_1.ButtonBuilder()
                .setCustomId(exports.INTERACTION_NEXT_ID)
                .setLabel('Next')
                .setStyle(discord_js_1.ButtonStyle.Primary)
                .setDisabled(end >= queue.length))
        ]
    };
}
exports.queueEmbedMessage = queueEmbedMessage;
function readVolumes() {
    console.log("reading volumes csv");
    let stream;
    stream = fs_1.default.createReadStream(volumesCSV).on('error', (err) => {
        fs_1.default.closeSync(fs_1.default.openSync('volumes.csv', 'w'));
    });
    var lineReader = readline_1.default.createInterface({
        input: stream
    });
    lineReader.on('line', (str) => {
        let line = str.split(',');
        volumes[line[0]] = parseInt(line[1]);
    });
    stream.once('end', () => {
        stream.close();
        writeVolumes();
        volumesFile = fs_1.default.openSync(volumesCSV, 'a');
    });
}
exports.readVolumes = readVolumes;
function writeVolumes() {
    var file = fs_1.default.createWriteStream(volumesCSV);
    file.on('error', function (err) {
        console.error("Can't write");
    });
    Object.keys(volumes).forEach((url) => {
        file.write(`${url},${volumes[url]}\n`);
    });
    file.end();
}
function getVolume(url) {
    let vol = volumes[url] || 5;
    return vol;
}
exports.getVolume = getVolume;
function setVolume(url, volume) {
    volumes[url] = volume;
    fs_1.default.appendFileSync(volumesFile, `${url},${volume}\n`);
}
exports.setVolume = setVolume;
