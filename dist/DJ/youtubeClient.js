"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERACTION_NEXT_ID = exports.INTERACTION_PREV_ID = void 0;
exports.getSongsFromUrl = getSongsFromUrl;
exports.addSongsToQueueAsync = addSongsToQueueAsync;
exports.getCachePlaylist = getCachePlaylist;
exports.searchYT = searchYT;
const googleapis_1 = require("googleapis");
const song_1 = require("./song");
const config_1 = require("../config");
const lodash_1 = require("lodash");
const queueEventEmitter_1 = require("./queueEventEmitter");
// TODO: separate utils by type
exports.INTERACTION_PREV_ID = 'queue_prev';
exports.INTERACTION_NEXT_ID = 'queue_next';
const youtube = googleapis_1.google.youtube('v3');
const apiKey = process.env.YT_API_KEY;
const prependURL = 'https://www.youtube.com/watch?v=';
const regexURL = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
let cachedPlaylist = [];
const queueEventEmitter = queueEventEmitter_1.QueueEventEmitter.getInstance();
async function getSongsFromUrl(url) {
    let songs = [];
    if (url.includes('/playlist?list=')) {
        let playlistId = url.split('/playlist?list=')[1];
        playlistId = playlistId.split('&')[0];
        let nextPageToken = null;
        do {
            let batch;
            [batch, nextPageToken] = await getPlaylistItems(playlistId, nextPageToken);
            songs = songs.concat(batch);
        } while (nextPageToken != null);
    }
    else {
        let song = await songFromURL(url);
        if (song != null) {
            songs.push(song);
        }
    }
    return songs;
}
async function addSongsToQueueAsync(queue, url) {
    if (url.includes('/playlist?list=')) {
        let playlistId = url.split('/playlist?list=')[1];
        playlistId = playlistId.split('&')[0];
        if (playlistId == config_1.config.playlistId) {
            await getCachePlaylist(queue);
        }
        else {
            await getPlaylistAsync(queue, playlistId, null);
        }
        return true;
    }
    queue.songs.push(await songFromURL(url));
    return false;
}
async function getCachePlaylist(queue, refresh = false) {
    if (cachedPlaylist.length == 0 || refresh) {
        await getPlaylistAsync(queue, config_1.config.playlistId, null);
    }
    else {
        queue.songs = (0, lodash_1.cloneDeep)(cachedPlaylist);
        queueEventEmitter.emitPlaylistLoaded(queue.id);
    }
}
async function searchYT(keyword) {
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
        return new song_1.Song(firstResult.snippet.title, prependURL + firstResult.id, firstResult.contentDetails.duration, firstResult.snippet.thumbnails.medium.url, firstResult.snippet.channelTitle);
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
async function getPlaylistAsync(queue, playlistId, nextPageToken) {
    var [songs, nextPageToken] = await getPlaylistItems(playlistId, nextPageToken);
    queue.songs.push(...songs);
    if (playlistId == config_1.config.playlistId) {
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
async function getPlaylistItems(playlistId, nextPageToken) {
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
        return new song_1.Song(item.snippet.title, prependURL + item.id, item.contentDetails.duration, item.snippet.thumbnails.medium.url, item.snippet.channelTitle);
    });
    return [songs, res.data.nextPageToken];
}
async function getSongMetadata(url) {
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
async function songFromURL(url) {
    let song = await getSongMetadata(url);
    if (!song) {
        return null;
    }
    return new song_1.Song(song.snippet.title, prependURL + song.id, song.contentDetails.duration, song.snippet.thumbnails.medium.url, song.snippet.channelTitle);
}
