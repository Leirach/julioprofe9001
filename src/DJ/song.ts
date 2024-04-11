export class Song {
    title: string;
    url: string;
    duration: string;
    thumbnail: string;
    volume: number;
    author: string;

    constructor(title: string = "", url: string, duration: string, thumbnail: string, author: string) {
        this.title = title;
        this.url = url;
        this.duration = duration;
        this.thumbnail = thumbnail;
        this.author = author;
    }
}
