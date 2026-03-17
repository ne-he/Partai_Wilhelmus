export async function GET() {
  try {
    const res = await fetch("https://beeble.vercel.app/api/v1/passage/list", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return Response.json({ error: `API error: ${res.status}` }, { status: res.status });
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "Fetch failed" }, { status: 500 });
  }
}
