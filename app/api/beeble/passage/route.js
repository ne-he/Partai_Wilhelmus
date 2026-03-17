export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const abbr = searchParams.get("abbr");
  const chapter = searchParams.get("chapter");
  if (!abbr || !chapter) return Response.json({ error: "Missing params" }, { status: 400 });

  try {
    const res = await fetch(
      `https://beeble.vercel.app/api/v1/passage/${abbr}/${chapter}?ver=tb`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return Response.json({ error: `API error: ${res.status}` }, { status: res.status });
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}
