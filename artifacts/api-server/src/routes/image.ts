import { Router, type IRouter } from "express";
import { GenerateImageBody, GenerateImageResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const STYLE_PREFIXES: Record<string, string> = {
  anime:     "anime style, vibrant colors, detailed illustration, studio ghibli quality,",
  realistic: "ultra-photorealistic, 8k DSLR photo, professional lighting, sharp focus,",
  cartoon:   "cartoon style, colorful, bold lines, fun illustration,",
  "3d":      "3D render, CGI, ray tracing, studio lighting, octane render,",
};

router.post("/image/generate", async (req, res): Promise<void> => {
  const parsed = GenerateImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { prompt, style } = parsed.data;
  const stylePrefix = STYLE_PREFIXES[style] ?? "high quality,";
  const enhancedPrompt = `${stylePrefix} ${prompt}`;

  try {
    const seed = Math.floor(Math.random() * 1_000_000);
    const encoded = encodeURIComponent(enhancedPrompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Pollinations error: ${response.status}`);

    const arrayBuf = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    res.json(GenerateImageResponse.parse({ images: [dataUrl] }));
  } catch (err) {
    logger.error({ err }, "Image generation failed");
    res.json(GenerateImageResponse.parse({ images: [] }));
  }
});

export default router;
