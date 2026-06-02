import { Router, type IRouter, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";

const MGMT_PASSWORD = "terrorist";
const router: IRouter = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_KEY ??
    "";
  if (!url || !key) return null;
  return createClient(url, key);
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", mp4: "video/mp4",
  };
  return map[ext] ?? "application/octet-stream";
}

router.post("/upload", async (req: Request, res: Response): Promise<void> => {
  const pwd = req.headers["x-mgmt-password"] as string | undefined;
  const auth = req.headers.authorization as string | undefined;
  const isOwner = pwd === MGMT_PASSWORD;
  const isAuthed = !!auth?.startsWith("Bearer ");

  if (!isOwner && !isAuthed) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    res.status(503).json({ error: "Storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });
    return;
  }

  const { base64, filename, bucket = "images" } = req.body as {
    base64: string;
    filename: string;
    bucket?: string;
  };

  if (!base64 || !filename) {
    res.status(400).json({ error: "base64 and filename required" });
    return;
  }

  try {
    // ensure bucket exists (public)
    await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});

    const buffer = Buffer.from(base64, "base64");
    const ext = filename.split(".").pop() ?? "jpg";
    const uniquePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const contentType = getMimeType(filename);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniquePath, buffer, { upsert: true, contentType });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    res.json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
