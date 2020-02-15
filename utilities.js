var fs = require('fs');
var d20 = require('d20');

/**
 * Loads copypastas from the files declared in config.json cp_files array, and 
 * concats them in a single array.
 * Copypastas must be separated by a single newline within the same file.
 */
exports.loadCopypastas = (cp_files) => {
    var copypasta = [];
    cp_files.forEach(file => {
        temp = fs.readFileSync(`./memes/${file}`).toString().split("\n\n");
        copypasta = copypasta.concat(temp);
    });

    return copypasta;
}

/**
 * Returns a random element from given array.
 * @param {array} arr 
 */
exports.getRandom = (arr) => {
    var idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
}

/**
 * Given probabilty % in decimal number, has that chance of returning true.
 * @param {float} probability must be between 0 and 1
 */
exports.randBool = (probability) => {
    if (probability <= 1 && probability >=0) {
        return Math.random() <= probability;
    }
    else {
        console.log(`probability of: ${probability} not in range. returning false`)
        return false
    }
}

/**
 * Returns a number based on the roll string, or corresponding instructions.
 * @param {string} params roll function string
 */
exports.roll = (params) => {
    if (params) {
       return d20.roll(params);
    }
    else {
        return "Usage: !roll (dice)"
    }
}

/**
 * Sets a timer for secs sent.
 * @param {sec} params time in seconds to sleep
 */
exports.sleep = (sec) => {
    return new Promise(resolve => setTimeout(resolve, sec*1000));
  }
  
