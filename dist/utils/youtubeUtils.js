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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgument = exports.songFromURL = exports.searchYT = exports.getPlaylist = void 0;
const googleapis_1 = require("googleapis");
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const musicClasses_1 = require("./musicClasses");
const youtube = googleapis_1.google.youtube('v3');
const apiKey = process.env.YT_API_KEY;
const prependURL = 'https://www.youtube.com/watch?v=';
function getPlaylist(playlist, nextPageToken) {
    return __awaiter(this, void 0, void 0, function* () {
        // check pagination for really long playlists
        if (!nextPageToken)
            return Array();
        if (nextPageToken == 'first')
            nextPageToken = null;
        // get video IDs from playlist
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
        let videoInfo = yield youtube.videos.list({
            key: apiKey,
            part: ['snippet', 'contentDetails'],
            id: videoIds,
        });
        let songs = videoInfo.data.items.map(item => {
            return new musicClasses_1.Song(item.snippet.title, prependURL + item.id, item.contentDetails.duration);
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
        return new musicClasses_1.Song(firstResult.snippet.title, prependURL + firstResult.id, firstResult.contentDetails.duration);
    });
}
exports.searchYT = searchYT;
function songFromURL(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let songInfo = yield ytdl_core_1.default.getInfo(url);
            songInfo.length_seconds;
            return new musicClasses_1.Song(songInfo.title, url, songInfo.length_seconds);
        }
        catch (err) {
            return null;
        }
    });
}
exports.songFromURL = songFromURL;
function parseArgument() {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.parseArgument = parseArgument;
