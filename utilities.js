var fs = require('fs');
var config = require('./config.json');

exports.loadCopypastas = function() {
    var copypasta = [];
    config.cp_files.forEach(file => {
        temp = fs.readFileSync(`./memes/${file}`).toString().split("\n\n");
        copypasta = copypasta.concat(temp);
    });

    return copypasta;
}

exports.getRandom = function(arr) {
    var idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
}