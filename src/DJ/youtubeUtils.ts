const { google } = require('googleapis');
const youtube = google.youtube('v3');

const apiKey = process.env.YT_API_KEY;

export async function getPlaylist(playlist: string, nextPageToken: string): Promise<Array<string>> {
    // console.log(`next token param: ${nextPageToken}`);
    if(!nextPageToken)
        return [];
    if (nextPageToken == 'first')
        nextPageToken = null;
    let songs = [];
    let res = await youtube.playlistItems.list({
        key: apiKey,
        part: 'snippet',
        playlistId: playlist,
        pageToken: nextPageToken,
        maxResults: 50,
    });
    songs = res.data.items;
    // console.log(`received next token: ${res.data.nextPageToken}`);
    return songs.concat( await getPlaylist(playlist, res.data.nextPageToken));
}

export async function searchYT(keyword: string){
    let res = await youtube.search.list({
        q: keyword,
        key: apiKey,
        part: 'snippet',
        safeSearch: "none",
        maxResults: 1,
    });
    // console.log(`https://www.youtube.com/watch?v=${res.data.items[0].id.videoId}`);
    if (!res.data.items[0].id.videoId){
        return null;
    }
    return `https://www.youtube.com/watch?v=${res.data.items[0].id.videoId}`;
}
