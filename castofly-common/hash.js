/*
    cyrb53 (c) 2018 bryc (github.com/bryc)
    A fast and simple hash function with decent collision resistance.
    Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
    Public domain. Attribution appreciated.

    https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
*/

function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function stringToHash(str) {
  return cyrb53(str);
}

export function jsonToHash(obj) {
  const jsonString = JSON.stringify(obj);
  return cyrb53(jsonString);
}

export function getTextToSpeechHash(text, voiceId) {
  return stringToHash(text + voiceId);
}

/**
 * @param {string} str
 * @param {int} low - inclusive
 * @param {int} high - exclusive
 */
export function stringToHashRange(str, low, high) {
  const range = Math.abs(high - low);
  const hashInt = cyrb53(str);
  return low + (hashInt % range);
}
