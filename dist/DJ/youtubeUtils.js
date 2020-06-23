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
exports.searchYT = exports.getPlaylist = void 0;
const { google } = require('googleapis');
const youtube = google.youtube('v3');
const apiKey = process.env.YT_API_KEY;
function getPlaylist(playlist, nextPageToken) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(`next token param: ${nextPageToken}`);
        if (!nextPageToken)
            return [];
        if (nextPageToken == 'first')
            nextPageToken = null;
        let songs = [];
        let res = yield youtube.playlistItems.list({
            key: apiKey,
            part: 'snippet',
            playlistId: playlist,
            pageToken: nextPageToken,
            maxResults: 50,
        });
        songs = res.data.items;
        // console.log(`received next token: ${res.data.nextPageToken}`);
        return songs.concat(yield getPlaylist(playlist, res.data.nextPageToken));
    });
}
exports.getPlaylist = getPlaylist;
function searchYT(keyword) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield youtube.search.list({
            q: keyword,
            key: apiKey,
            part: 'snippet',
            safeSearch: "none",
            maxResults: 1,
        });
        // console.log(`https://www.youtube.com/watch?v=${res.data.items[0].id.videoId}`);
        if (!res.data.items[0].id.videoId) {
            return null;
        }
        return `https://www.youtube.com/watch?v=${res.data.items[0].id.videoId}`;
    });
}
exports.searchYT = searchYT;
