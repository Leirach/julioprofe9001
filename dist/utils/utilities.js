"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isURL = exports.sleep = exports.randBool = exports.getRandom = exports.loadCopypastas = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Loads copypastas from the files declared in config.json cp_files array, and
 * concats them in a single array.
 * Copypastas must be separated by a single newline within the same file.
 */
function loadCopypastas(cp_files) {
    var copypasta = [];
    cp_files.forEach((file) => {
        let cp_path = path_1.default.join(__dirname, '..', 'memes', file);
        let temp = fs_1.default.readFileSync(cp_path).toString().split("\n");
        copypasta = copypasta.concat(temp);
    });
    return copypasta;
}
exports.loadCopypastas = loadCopypastas;
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
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return pattern.test(str);
}
exports.isURL = isURL;
