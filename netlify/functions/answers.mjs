import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore("brief-answers");
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    // GET — return all users' data
    if (req.method === "GET") {
      const allData = {};
      const { blobs } = await store.list();
      for (const blob of blobs) {
        const data = await store.get(blob.key, { type: "json" });
        if (data) allData[blob.key] = data;
      }
      return new Response(JSON.stringify(allData), { status: 200, headers });
    }

    // POST — save one user's data
    if (req.method === "POST") {
      const body = await req.json();
      const { user, answers, comments } = body;

      if (!user) {
        return new Response(JSON.stringify({ error: "user required" }), { status: 400, headers });
      }

      const existing = await store.get(user, { type: "json" }).catch(() => null);

      // Merge comments instead of overwriting — combine by timestamp to avoid duplicates
      const mergedComments = {};
      const allKeys = new Set([
        ...Object.keys(existing?.comments ?? {}),
        ...Object.keys(comments ?? {}),
      ]);
      for (const k of allKeys) {
        const sc = existing?.comments?.[k] || [];
        const nc = comments?.[k] || [];
        const seen = new Set(sc.map((c) => c.time));
        mergedComments[k] = [...sc, ...nc.filter((c) => !seen.has(c.time))];
      }

      const updated = {
        user,
        answers: { ...(existing?.answers ?? {}), ...(answers ?? {}) },
        comments: mergedComments,
        updatedAt: new Date().toISOString(),
      };

      await store.setJSON(user, updated);
      return new Response(JSON.stringify({ ok: true, data: updated }), { status: 200, headers });
    }

    // DELETE — wipe all users' data
    if (req.method === "DELETE") {
      const { blobs } = await store.list();
      for (const blob of blobs) {
        await store.delete(blob.key);
      }
      return new Response(JSON.stringify({ ok: true, deleted: blobs.length }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};

export const config = { path: "/api/answers" };
