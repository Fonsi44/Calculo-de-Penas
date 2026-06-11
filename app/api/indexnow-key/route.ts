export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return new Response("IndexNow no configurado. Define INDEXNOW_KEY en .env.local", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
