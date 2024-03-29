import { google } from 'googleapis';
import { Song } from "./musicClasses";
import { Duration } from 'luxon';
import { config } from '../config';
import fs from 'fs';
import readline from 'readline';
import { MessageCreateOptions, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// TODO: separate utils by type

export const INTERACTION_PREV_ID = 'queue_prev';
export const INTERACTION_NEXT_ID = 'queue_next';

const youtube = google.youtube('v3');
const apiKey = process.env.YT_API_KEY;
const prependURL = 'https://www.youtube.com/watch?v=';
const volumesCSV = './memes/volumes.csv';
const regexURL = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/

export const QUEUE_PAGE_SIZE = 8;

let cachedPlaylist: Song[] = [];
let volumesFile: number;
let volumes: any = {};
readVolumes((data: any) => {
    volumes = data;
});

// recursive method to get a playlist
// it's kinda slow...
async function getPlaylistRec(playlist: string, nextPageToken: string): Promise<Array<Song>> {
    console.log(nextPageToken);
    // check pagination for really long playlists
    if (!nextPageToken)
        return Array<Song>();
    if (nextPageToken == 'first')
        nextPageToken = null;

    // get video IDs from playlist
    let res = await youtube.playlistItems.list({
        key: apiKey,
        part: ['snippet'],
        playlistId: playlist,
        pageToken: nextPageToken,
        maxResults: 50,
    });

    // map the ids to an array and then request the video info
    // 50 at a time to reduce api quota usage
    let videoIds = res.data.items.map(item => {
        return item.snippet.resourceId.videoId;
    });

    // This nasty ass bottleneck will stop the thread for ~500 ms every 50 songs in a playlist
    // I should probably do something about it
    let videoInfo = await youtube.videos.list({
        key: apiKey,
        part: ['snippet', 'contentDetails'],
        id: videoIds,
    });

    let songs = videoInfo.data.items.map(item => {
        return new Song(item.snippet.title,
            prependURL + item.id,
            item.contentDetails.duration,
            item.snippet.thumbnails.medium.url,
            item.snippet.channelTitle);
    });

    return songs.concat(await getPlaylistRec(playlist, res.data.nextPageToken));
}

async function getPlaylist(playlist: string): Promise<Array<Song>> {
    return getPlaylistRec(playlist, 'first');
}

async function getSongMetadata(url: string) {
    var match = url.match(regexURL);
    let songid = (match && match[7].length == 11) ? match[7] : '';
    if (!songid) {
        return null;
    }
    let res = await youtube.videos.list({
        key: apiKey,
        part: ['snippet', 'contentDetails'],
        id: [songid],
    });
    if (!res) {
        return null;
    }
    return res.data.items[0];
}

async function songFromURL(url: string) {
    let song = await getSongMetadata(url);
    if (!song) {
        return null;
    }
    return new Song(song.snippet.title,
        prependURL + song.id,
        song.contentDetails.duration,
        song.snippet.thumbnails.medium.url,
        song.snippet.channelTitle);
}

export async function searchYT(keyword: string) {
    let res;
    try {
        res = await youtube.search.list({
            q: keyword,
            key: apiKey,
            part: ['snippet'],
            safeSearch: "none",
            maxResults: 1,
        });
    } catch (err) {
        console.error(err);
        throw err;
    }

    if (!res.data.items) {
        return null;
    }
    let id = res.data.items[0].id.videoId;
    let videoInfo;
    try {
        videoInfo = await youtube.videos.list({
            key: apiKey,
            part: ['snippet', 'contentDetails'],
            id: [id],
        });
    } catch (err) {
        console.error(err);
        throw err;
    }

    const firstResult = videoInfo.data.items[0];
    return new Song(firstResult.snippet.title,
        prependURL + firstResult.id,
        firstResult.contentDetails.duration,
        firstResult.snippet.thumbnails.medium.url,
        firstResult.snippet.channelTitle)
}

export async function getSongs(url: string) {
    if (url.includes('/playlist?list=')) {
        let playlistId = url.split('/playlist?list=')[1];
        playlistId = playlistId.split('&')[0];
        if (playlistId == config.playlistId) {
            console.log('fetching from cache');
            return cachePlaylist();
        }
        return getPlaylist(playlistId);
    }
    return songFromURL(url);
}

// Utilities
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
        .addFields([{name: song.author, value: `${timestamp} Volume: ${getVolume(song.url)}`}])
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
            // TODO: what the fuck is this yo
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

export async function cachePlaylist(refresh = false) {
    if (cachedPlaylist.length < 1 || refresh) {
        console.log("trayendo playlist");
        let res = await getPlaylist(config.playlistId);
        if (!(res instanceof Array))
            res = [res];
        cachedPlaylist = res;
    }
    console.log("playlist guardada, regresando de cache");
    return cachedPlaylist;
}

export function readVolumes(callback: Function) {
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
