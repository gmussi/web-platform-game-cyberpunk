import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { seed, world } = req.body || {};
    if (!seed || !world) {
      res.status(400).json({ error: "Missing seed or world" });
      return;
    }
    const fileName = `${String(seed)}.json`;
    const dir = path.join(process.cwd(), "public", "assets", "maps");
    const filePath = path.join(dir, fileName);
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(world, null, 2),
      "utf8"
    );
    res.status(200).json({ ok: true, file: fileName });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to save world" });
  }
}
