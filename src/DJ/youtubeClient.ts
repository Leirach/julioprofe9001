import { google } from 'googleapis';
import { Song } from './song';
import { QueueContract } from './queueContract';
import { config } from '../config';
import { cloneDeep } from 'lodash';
import { QueueEventEmitter } from './queueEventEmitter';

// TODO: separate utils by type

export const INTERACTION_PREV_ID = 'queue_prev';
export const INTERACTION_NEXT_ID = 'queue_next';

const youtube = google.youtube('v3');
const apiKey = process.env.YT_API_KEY;
const prependURL = 'https://www.youtube.com/watch?v=';
const regexURL = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/

let cachedPlaylist: Song[] = [];
const queueEventEmitter = QueueEventEmitter.getInstance();

export async function getSongs(queue: QueueContract, url: string) {
    if (url.includes('/playlist?list=')) {
        let playlistId = url.split('/playlist?list=')[1];
        playlistId = playlistId.split('&')[0];
        if (playlistId == config.playlistId) {
            await getCachePlaylist(queue);
        }
        else {
            await getPlaylistAsync(queue, playlistId, null);
        }
        return true;
    }
    queue.songs.push(await songFromURL(url))
    return false;
}

export async function getCachePlaylist(queue: QueueContract, refresh = false) : Promise<void> {
    if (cachedPlaylist.length == 0 || refresh) {
        await getPlaylistAsync(queue, config.playlistId, null);
    }
    else {
        queue.songs = cloneDeep(cachedPlaylist);
        queueEventEmitter.emitPlaylistLoaded(queue.id);
    }
}

export async function searchYT(keyword: string) {
    try {
        let res = await youtube.search.list({
            q: keyword,
            key: apiKey,
            part: ['snippet'],
            safeSearch: "none",
            maxResults: 1,
        });

        if (!res.data.items) {
            return null;
        }

        let id = res.data.items[0].id.videoId;
        let videoInfo;
        videoInfo = await youtube.videos.list({
            key: apiKey,
            part: ['snippet', 'contentDetails'],
            id: [id],
        });

        const firstResult = videoInfo.data.items[0];
        return new Song(firstResult.snippet.title,
            prependURL + firstResult.id,
            firstResult.contentDetails.duration,
            firstResult.snippet.thumbnails.medium.url,
            firstResult.snippet.channelTitle)

    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function getPlaylistAsync(queue: QueueContract, playlistId: string, nextPageToken: string): Promise<void> {
    var [songs, nextPageToken] = await getPlaylistItems(playlistId, nextPageToken);

    queue.songs.push(...songs);
    if (playlistId == config.playlistId){
        cachedPlaylist.push(...songs);
    }

    if (nextPageToken) {
        getPlaylistAsync(queue, playlistId, nextPageToken).catch(err => {
            console.error(`Failed to load playlist page. pageToken: ${nextPageToken}, error: ${err}`);
        });
    }
    else {
        queueEventEmitter.emitPlaylistLoaded(queue.id);
    }
}

async function getPlaylistItems(playlistId: string, nextPageToken: string): Promise<[Song[], string]> {
    // get video IDs from playlist
    let res = await youtube.playlistItems.list({
        key: apiKey,
        part: ['snippet'],
        playlistId: playlistId,
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

    var songs = videoInfo.data.items.map(item => {
        return new Song(item.snippet.title,
            prependURL + item.id,
            item.contentDetails.duration,
            item.snippet.thumbnails.medium.url,
            item.snippet.channelTitle);
    });
    return [songs, res.data.nextPageToken]
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
