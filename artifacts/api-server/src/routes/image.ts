import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { GenerateImageBody, GenerateImageResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function getGeminiApiKey(): Promise<string | null> {
  const [settings] = await db.select().from(settingsTable).limit(1);
  return settings?.geminiApiKey ?? process.env.GEMINI_API_KEY ?? null;
}

const STYLE_PREFIXES: Record<string, string> = {
  anime: "anime style, vibrant colors, detailed illustration,",
  realistic: "photorealistic, highly detailed, 8k resolution,",
  cartoon: "cartoon style, colorful, bold lines, fun,",
  "3d": "3D render, CGI, ray tracing, studio lighting,",
};

router.post("/image/generate", async (req, res): Promise<void> => {
  const parsed = GenerateImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { prompt, style } = parsed.data;
  const apiKey = await getGeminiApiKey();

  if (!apiKey) {
    res.json(GenerateImageResponse.parse({
      images: [],
    }));
    return;
  }

  try {
    const stylePrefix = STYLE_PREFIXES[style] ?? "";
    const enhancedPrompt = `${stylePrefix} ${prompt}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: enhancedPrompt }],
          parameters: { sampleCount: 2 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Image generation error: ${response.status}`);
    }

    const data = await response.json() as { predictions?: { bytesBase64Encoded?: string; mimeType?: string }[] };
    const images = (data.predictions ?? [])
      .filter(p => p.bytesBase64Encoded)
      .map(p => `data:${p.mimeType ?? "image/png"};base64,${p.bytesBase64Encoded}`);

    res.json(GenerateImageResponse.parse({ images }));
  } catch (err) {
    logger.error({ err }, "Image generation failed");
    res.json(GenerateImageResponse.parse({ images: [] }));
  }
});

export default router;
