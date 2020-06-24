import fs from 'fs';
import path from 'path'

/**
 * Loads copypastas from the files declared in config.json cp_files array, and 
 * concats them in a single array.
 * Copypastas must be separated by a single newline within the same file.
 */
function loadCopypastas(cp_files: string[]) {
    var copypasta:any = [];
    cp_files.forEach( (file: string) => {
        let cp_path = path.join(__dirname, '..', 'memes', file);
        let temp = fs.readFileSync(cp_path).toString().split("\n");
        copypasta = copypasta.concat(temp);
    });

    return copypasta;
}

/**
 * Returns a random element from given array.
 * @param {array} arr 
 */
function getRandom (arr: any[]) {
    var idx = Math.floor(Math.random() * arr.length);
    return arr[idx];
}

/**
 * Given probabilty % in decimal number, has that chance of returning true.
 * @param probability must be between 0 and 1
 */
function randBool (probability: number) {
    if (probability <= 1 && probability >=0) {
        return Math.random() <= probability;
    }
    else {
        console.log(`probability of: ${probability} not in range. returning false`)
        return false
    }
}

/**
 * Sets a timer for secs sent.
 * @param sec time in seconds to sleep
 */
function sleep (sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec*1000));
}
/**
 * Return checks if a given string is a url
 * @param str 
 */
function isURL(str: string) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return pattern.test(str);
  }

export {loadCopypastas, getRandom, randBool, sleep, isURL}
