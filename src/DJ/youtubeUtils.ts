import { google } from 'googleapis';
import ytdl from 'ytdl-core';
import { Song } from "./musicClasses";

const youtube = google.youtube('v3');
const apiKey = process.env.YT_API_KEY;
const prependURL = 'https://www.youtube.com/watch?v=';

export async function getPlaylist(playlist: string, nextPageToken: string): Promise<Array<Song>> {
    // check pagination for really long playlists
    if(!nextPageToken)
        return Array<Song>();
    if (nextPageToken == 'first')
        nextPageToken = null;

    // get video IDs from playlist
    console.log("getting playlist");
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
        part: ['snippet'],
        id: videoIds,
    });

    let songs = videoInfo.data.items.map(item => {
        return new Song(item.snippet.title,  prependURL+item.id, "0");
    });

    return songs.concat(await getPlaylist(playlist, res.data.nextPageToken));
}

export async function searchYT(keyword: string){
    let res = await youtube.search.list({
        q: keyword,
        key: apiKey,
        part: ['snippet'],
        safeSearch: "none",
        maxResults: 1,
    });
    if (!res.data.items){
        return null;
    }
    let id = res.data.items[0].id.videoId;
    let videoInfo = await youtube.videos.list({
        key: apiKey,
        part: ['snippet','contentDetails'],
        id: [id],
    });
    const firstResult = videoInfo.data.items[0];
    
    return new Song(firstResult.snippet.title, prependURL+firstResult.id, firstResult.contentDetails.duration)
}

export async function songFromURL(url: string) {
    try {
        let songInfo = await ytdl.getInfo(url);
        songInfo.length_seconds
        return new Song(songInfo.title, url, songInfo.length_seconds);
    } catch (err) {
        return null;
    }
}

export async function getSongs(url: string) {
    if(url.includes('/playlist?list=')){
        let playlistId = url.split('/playlist?list=')[1];
        playlistId = playlistId.split('&')[0];
        return getPlaylist(playlistId, "first");
    }
    return songFromURL(url);
}