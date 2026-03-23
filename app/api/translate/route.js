import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');

  if (!text) {
    return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|id`;
    const response = await fetch(url, { signal: controller.signal });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    const data = await response.json();
    const translatedText = data?.responseData?.translatedText;

    if (!translatedText) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    return NextResponse.json({ translatedText });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Network error' }, { status: 500 });
  }
}
