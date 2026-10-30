/* Shared list storage on Vercel Blob.
   GET  /api/list  -> { data }
   PUT  /api/list  -> { data } saved, last write wins

   If the blob store is not wired up yet this answers 503 and the app
   quietly falls back to this-device-only storage. */
import { list, put } from "@vercel/blob";

const PATH = "ration/list.json";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: "blob store not configured" });
  }

  try {
    if (req.method === "GET") {
      const { blobs } = await list({ prefix: PATH, limit: 1 });
      if (!blobs.length) return res.status(200).json({ data: null });
      const r = await fetch(blobs[0].url, { cache: "no-store" });
      if (!r.ok) return res.status(200).json({ data: null });
      return res.status(200).json({ data: await r.json() });
    }

    if (req.method === "PUT" || req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      const data = body && body.data;
      if (!data || typeof data !== "object") {
        return res.status(400).json({ error: "no data" });
      }
      data.updatedAt = Number(data.updatedAt) || Date.now();
      await put(PATH, JSON.stringify(data), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 0
      });
      return res.status(200).json({ ok: true, updatedAt: data.updatedAt });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
