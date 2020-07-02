"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimestamp = exports.getSongs = exports.songFromURL = exports.getSongMetadata = exports.searchYT = exports.getPlaylist = void 0;
const googleapis_1 = require("googleapis");
const musicClasses_1 = require("./musicClasses");
const luxon_1 = require("luxon");
const youtube = googleapis_1.google.youtube('v3');
const apiKey = process.env.YT_API_KEY;
const prependURL = 'https://www.youtube.com/watch?v=';
const regexURL = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
function getPlaylist(playlist, nextPageToken) {
    return __awaiter(this, void 0, void 0, function* () {
        // check pagination for really long playlists
        if (!nextPageToken)
            return Array();
        if (nextPageToken == 'first')
            nextPageToken = null;
        // get video IDs from playlist
        // console.log("getting playlist");
        let res = yield youtube.playlistItems.list({
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
        let videoInfo = yield youtube.videos.list({
            key: apiKey,
            part: ['snippet', 'contentDetails'],
            id: videoIds,
        });
        let songs = videoInfo.data.items.map(item => {
            return new musicClasses_1.Song(item.snippet.title, prependURL + item.id, item.contentDetails.duration, item.snippet.thumbnails.medium.url);
        });
        return songs.concat(yield getPlaylist(playlist, res.data.nextPageToken));
    });
}
exports.getPlaylist = getPlaylist;
function searchYT(keyword) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield youtube.search.list({
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
        let videoInfo = yield youtube.videos.list({
            key: apiKey,
            part: ['snippet', 'contentDetails'],
            id: [id],
        });
        const firstResult = videoInfo.data.items[0];
        return new musicClasses_1.Song(firstResult.snippet.title, prependURL + firstResult.id, firstResult.contentDetails.duration, firstResult.snippet.thumbnails.medium.url);
    });
}
exports.searchYT = searchYT;
function getSongMetadata(url) {
    return __awaiter(this, void 0, void 0, function* () {
        var match = url.match(regexURL);
        let songid = (match && match[7].length == 11) ? match[7] : '';
        if (!songid) {
            return null;
        }
        let res = yield youtube.videos.list({
            key: apiKey,
            part: ['snippet', 'contentDetails'],
            id: [songid],
        });
        if (!res) {
            return null;
        }
        return res.data.items[0];
    });
}
exports.getSongMetadata = getSongMetadata;
function songFromURL(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let song = yield getSongMetadata(url);
        if (!song) {
            return null;
        }
        return new musicClasses_1.Song(song.snippet.title, prependURL + song.id, song.contentDetails.duration, song.snippet.thumbnails.medium.url);
        /*
        try {
            let songInfo = await ytdl.getInfo(url);
            return new Song(songInfo.title, url, songInfo.length_seconds);
        } catch (err) {
            return null;
        }
        */
    });
}
exports.songFromURL = songFromURL;
function getSongs(url) {
    return __awaiter(this, void 0, void 0, function* () {
        if (url.includes('/playlist?list=')) {
            let playlistId = url.split('/playlist?list=')[1];
            playlistId = playlistId.split('&')[0];
            return getPlaylist(playlistId, "first");
        }
        return songFromURL(url);
    });
}
exports.getSongs = getSongs;
function getTimestamp(stream, total) {
    let ltime = luxon_1.Duration.fromMillis(stream);
    let tTime = luxon_1.Duration.fromISO(total);
    let format;
    format = tTime.as('hours') < 1 ? 'mm:ss' : 'hh:mm:ss';
    return ltime.toFormat(format) + '/' + tTime.toFormat(format);
}
exports.getTimestamp = getTimestamp;
