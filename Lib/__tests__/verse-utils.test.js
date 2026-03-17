import fc from 'fast-check';
import { seededRandom, computeDateSeed, formatReference, pickWithSeed } from '../verse-utils';

// Feature: verse-of-the-day-v3, Property 1: seededRandom is deterministic for the same seed
test('Property 1: seededRandom is deterministic', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 2 ** 31 - 1 }),
      (seed) => {
        const r1 = seededRandom(seed)();
        const r2 = seededRandom(seed)();
        return r1 === r2;
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: verse-of-the-day-v3, Property 2: computeDateSeed ignores time components
test('Property 2: computeDateSeed ignores time components', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 2000, max: 2100 }),
      fc.integer({ min: 0, max: 11 }),
      fc.integer({ min: 1, max: 28 }),
      fc.integer({ min: 0, max: 23 }),
      fc.integer({ min: 0, max: 23 }),
      (year, month, day, hour1, hour2) => {
        const d1 = new Date(year, month, day, hour1, 30, 0);
        const d2 = new Date(year, month, day, hour2, 45, 59);
        return computeDateSeed(d1) === computeDateSeed(d2);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: verse-of-the-day-v3, Property 3: formatReference always produces "{bookName} {chapter}:{verseNumber}"
test('Property 3: formatReference produces correct format', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1 }),
      fc.integer({ min: 1, max: 150 }),
      fc.integer({ min: 1, max: 176 }),
      (bookName, chapter, verseNumber) => {
        const ref = formatReference(bookName, chapter, verseNumber);
        return ref === `${bookName} ${chapter}:${verseNumber}`;
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: verse-of-the-day-v3, Property 4: pickWithSeed always returns an element that exists in the array
test('Property 4: pickWithSeed always returns a valid array element', () => {
  fc.assert(
    fc.property(
      fc.array(fc.anything(), { minLength: 1, maxLength: 200 }),
      fc.integer({ min: 1, max: 2 ** 31 - 1 }),
      (arr, seed) => {
        const result = pickWithSeed(arr, seed);
        return arr.includes(result);
      }
    ),
    { numRuns: 100 }
  );
});
