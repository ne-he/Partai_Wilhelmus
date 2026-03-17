/**
 * Utility functions for Verse of The Day feature.
 * All functions are pure — no external dependencies.
 */

/**
 * Computes a unique integer seed for a given date based on year, month, and day.
 * Time components (hour, minute, second) are intentionally ignored.
 *
 * @param {Date} date
 * @returns {number} integer in the form YYYYMMDD, e.g. 20250715
 */
export function computeDateSeed(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate();       // 1-31
  return y * 10000 + m * 100 + d;
}

/**
 * Mulberry32 PRNG — returns a function that produces floats in [0, 1).
 *
 * @param {number} seed - integer seed
 * @returns {() => number} stateful random function
 */
export function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Picks one element from an array deterministically using a seed.
 *
 * @param {Array} arr - non-empty array
 * @param {number} seed - integer seed
 * @returns {*} one element from arr
 */
export function pickWithSeed(arr, seed) {
  const rand = seededRandom(seed);
  const index = Math.floor(rand() * arr.length);
  return arr[index];
}

/**
 * Formats a verse reference string.
 *
 * @param {string} bookName - e.g. "Yohanes"
 * @param {number} chapter  - e.g. 3
 * @param {number} verseNumber - e.g. 16
 * @returns {string} e.g. "Yohanes 3:16"
 */
export function formatReference(bookName, chapter, verseNumber) {
  return `${bookName} ${chapter}:${verseNumber}`;
}
