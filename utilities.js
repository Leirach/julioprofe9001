var fs = require('fs');
exports.loadCopypastas = function() {
    copypasta = fs.readFileSync('copypasta.txt').toString().split("\n");
    redditpasta = fs.readFileSync('redditpasta.txt').toString().split("\n\n");
    copypasta = copypasta.concat(redditpasta);
    return copypasta;
}

exports.getRandom = function(arr) {
    var idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
}