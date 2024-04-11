import { Duration } from 'luxon';
import { config } from '../config';
import fs from 'fs';
import readline from 'readline';
import { MessageCreateOptions, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Song } from './song';

export const INTERACTION_PREV_ID = 'queue_prev';
export const INTERACTION_NEXT_ID = 'queue_next';
export const QUEUE_PAGE_SIZE = 8;

const volumesCSV = './memes/volumes.csv';

let volumesFile: number;
let volumes: any = {};
readVolumes();

export function songEmbed(title: string, song: Song, streamTime: number): MessageCreateOptions {
    let ltime = Duration.fromMillis(streamTime);
    let tTime = Duration.fromISO(song.duration);
    let format = tTime.as('hours') < 1 ? 'mm:ss' : 'hh:mm:ss';
    let timestamp: string;
    if (streamTime > 0) {
        timestamp = ltime.toFormat(format) + '/' + tTime.toFormat(format);
    }
    else {
        timestamp = tTime.toFormat(format);
    }

    let embed = new EmbedBuilder()
        .setAuthor({ name: `${title}:`, iconURL: config.avatarUrl })
        .setTitle(song.title)
        .setURL(song.url)
        .setThumbnail(config.avatarUrl)
        .addFields([{ name: song.author, value: `${timestamp} Volume: ${getVolume(song.url)}` }])
        .setImage(song.thumbnail);
    return { embeds: [embed] };
}

export function queueEmbedMessage(queue: Song[], start_idx: number): MessageCreateOptions {
    const end = start_idx + QUEUE_PAGE_SIZE;
    const cur_queue = queue.slice(start_idx, end);

    let embed = new EmbedBuilder()
        .setAuthor({ name: `Queue`, iconURL: config.avatarUrl })
        .setTitle(`${start_idx + 1} - ${end} of ${queue.length}:`)
        .setThumbnail(cur_queue[0].thumbnail);

    let description = "";
    cur_queue.forEach(((song, idx) => {
        description += `**${start_idx + idx + 1}. [${song.title}](${song.url})**`;
        description += `${song.author}`
        if (idx + 1 < QUEUE_PAGE_SIZE) {
            description += "\n\n";
        }
    }))
    embed.setDescription(description);

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(INTERACTION_PREV_ID)
                        .setLabel('Prev')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(start_idx == 0),
                    new ButtonBuilder()
                        .setCustomId(INTERACTION_NEXT_ID)
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(end >= queue.length)
                )
        ]
    };
}

export function readVolumes() {
    console.log("reading volumes csv");
    let stream: fs.ReadStream;
    stream = fs.createReadStream(volumesCSV).on('error', (err: Error) => {
        fs.closeSync(fs.openSync('volumes.csv', 'w'));
    });
    var lineReader = readline.createInterface({
        input: stream
    });
    lineReader.on('line', (str: string) => {
        let line = str.split(',');
        volumes[line[0]] = parseInt(line[1]);
    });
    stream.once('end', () => {
        stream.close();
        writeVolumes();
        volumesFile = fs.openSync(volumesCSV, 'a');
    });
}

function writeVolumes() {
    var file = fs.createWriteStream(volumesCSV);
    file.on('error', function (err) {
        console.error("Can't write");
    });
    Object.keys(volumes).forEach((url: string) => {
        file.write(`${url},${volumes[url]}\n`);
    });
    file.end();
}

export function getVolume(url: string) {
    let vol = volumes[url] || 5;
    return vol;
}

export function setVolume(url: string, volume: number) {
    volumes[url] = volume;
    fs.appendFileSync(volumesFile, `${url},${volume}\n`);
}
