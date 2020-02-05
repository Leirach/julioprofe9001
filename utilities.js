var fs = require('fs');
var config = require('./config.json');
var d20 = require('d20');

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

// probability must be between 1-0
exports.randBool = function(probability) {
    if (probability <= 1 && probability >=0) {
        return Math.random() <= probability;
    }
    else {
        console.log(`probability of: ${probability} not in range. returning false`)
        return false
    }
}

exports.roll = function(params) {
    if (params) {
       return d20.roll(params);
    }
    else {
        return "Usage: !roll (dice)"
    }
}