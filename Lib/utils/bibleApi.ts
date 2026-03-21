export interface Verse {
  reference: string;
  text: string;
  translationId: string;
}

const STORAGE_KEY = 'dailyVerse';
const STORAGE_DATE_KEY = 'dailyVerseDate';

export async function getDailyVerse(): Promise<Verse> {
  const today = new Date().toISOString().slice(0, 10);
  const cachedDate = localStorage.getItem(STORAGE_DATE_KEY);
  const cachedVerse = localStorage.getItem(STORAGE_KEY);

  if (cachedDate === today && cachedVerse) {
    return JSON.parse(cachedVerse);
  }

  const verse = await fetchRandomVerse();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(verse));
  localStorage.setItem(STORAGE_DATE_KEY, today);
  return verse;
}

export async function fetchRandomVerse(): Promise<Verse> {
  const res = await fetch('https://bible-api.com/?random=1');
  if (!res.ok) throw new Error('Gagal mengambil ayat dari server.');
  const data = await res.json();
  return {
    reference: data.reference,
    text: data.text?.trim() || '',
    translationId: (data.translation_id || 'KJV').toUpperCase(),
  };
}
