"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Song = void 0;
class Song {
    constructor(title = "", url, duration, thumbnail, author) {
        this.title = title;
        this.url = url;
        this.duration = duration;
        this.thumbnail = thumbnail;
        this.author = author;
    }
}
exports.Song = Song;
