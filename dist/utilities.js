"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffleArray = exports.isURL = exports.sleep = exports.randBool = exports.getRandom = void 0;
/**
 * Returns a random element from given array.
 * @param {array} arr
 */
function getRandom(arr) {
    var idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
}
exports.getRandom = getRandom;
/**
 * Given probabilty % in decimal number, has that chance of returning true.
 * @param probability must be between 0 and 1
 */
function randBool(probability) {
    if (probability <= 1 && probability >= 0) {
        return Math.random() <= probability;
    }
    else {
        console.log(`probability of: ${probability} not in range. returning false`);
        return false;
    }
}
exports.randBool = randBool;
/**
 * Sets a timer for secs sent.
 * @param sec time in seconds to sleep
 */
function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}
exports.sleep = sleep;
/**
 * Return checks if a given string is a url
 * @param str
 */
function isURL(str) {
    var pattern = new RegExp("^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$");
    return pattern.test(str);
}
exports.isURL = isURL;
/**
 * Shuffles any given array
 * @param array
 */
function shuffleArray(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
exports.shuffleArray = shuffleArray;
