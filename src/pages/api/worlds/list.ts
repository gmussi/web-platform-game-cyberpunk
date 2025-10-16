import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const dir = path.join(process.cwd(), "public", "assets", "maps");
    const files = await fs.promises.readdir(dir);
    const jsonFiles = files.filter((f) => f.toLowerCase().endsWith(".json"));
    res.status(200).json({ files: jsonFiles });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to list worlds" });
  }
}
