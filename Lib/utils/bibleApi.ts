export interface Verse {
  reference: string;
  text: string;
  translation: string;
  cachedAt: string; // YYYY-MM-DD
}

const VERSE_REFS = [
  "john 3:16",
  "psalm 23:1",
  "romans 8:28",
  "philippians 4:13",
  "jeremiah 29:11",
  "proverbs 3:5",
  "isaiah 40:31",
  "matthew 6:33",
  "psalm 46:1",
  "romans 8:38-39",
  "john 14:6",
  "psalm 119:105",
  "2 timothy 1:7",
  "matthew 11:28",
  "john 16:33",
  "romans 5:8",
  "ephesians 2:8",
  "psalm 27:1",
  "isaiah 41:10",
  "hebrews 11:1",
];

export async function fetchRandomVerse(): Promise<Verse> {
  const ref = VERSE_REFS[Math.floor(Math.random() * VERSE_REFS.length)];
  const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch verse: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const today = new Date().toLocaleDateString("en-CA");

  return {
    reference: data.reference,
    text: data.text.trim(),
    translation: data.translation_id?.toUpperCase() || "KJV",
    cachedAt: today,
  };
}

export async function getDailyVerse(): Promise<Verse> {
  const today = new Date().toLocaleDateString("en-CA");
  const cacheKey = "daily_verse_" + today;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as Verse;
      if (parsed.text && parsed.reference && parsed.cachedAt) {
        return parsed;
      }
    } catch {
      // invalid JSON, fall through to fetch
    }
  }

  const verse = await fetchRandomVerse();
  localStorage.setItem(cacheKey, JSON.stringify(verse));
  return verse;
}
