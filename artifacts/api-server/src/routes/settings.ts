import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import {
  SaveSettingsBody,
  GetSettingsResponse,
  SaveSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/settings", async (req, res): Promise<void> => {
  const [settings] = await db.select().from(settingsTable).limit(1);

  if (!settings) {
    res.json(GetSettingsResponse.parse({
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasElevenLabsKey: !!process.env.ELEVEN_LABS_API_KEY,
      hasTavilyKey: !!process.env.TAVILY_API_KEY,
      theme: "dark",
    }));
    return;
  }

  res.json(GetSettingsResponse.parse({
    hasGeminiKey: !!(settings.geminiApiKey || process.env.GEMINI_API_KEY),
    hasElevenLabsKey: !!(settings.elevenLabsApiKey || process.env.ELEVEN_LABS_API_KEY),
    hasTavilyKey: !!(settings.tavilyApiKey || process.env.TAVILY_API_KEY),
    theme: settings.theme ?? "dark",
  }));
});

router.post("/settings", async (req, res): Promise<void> => {
  const parsed = SaveSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { geminiApiKey, elevenLabsApiKey, tavilyApiKey, theme } = parsed.data;

  const [existing] = await db.select().from(settingsTable).limit(1);

  const updateData: Record<string, string | null> = {};
  if (geminiApiKey !== undefined) updateData.geminiApiKey = geminiApiKey;
  if (elevenLabsApiKey !== undefined) updateData.elevenLabsApiKey = elevenLabsApiKey;
  if (tavilyApiKey !== undefined) updateData.tavilyApiKey = tavilyApiKey;
  if (theme !== undefined && theme !== null) updateData.theme = theme;

  let saved;
  if (existing) {
    const [updated] = await db
      .update(settingsTable)
      .set(updateData)
      .returning();
    saved = updated;
  } else {
    const [inserted] = await db
      .insert(settingsTable)
      .values({
        geminiApiKey: geminiApiKey ?? null,
        elevenLabsApiKey: elevenLabsApiKey ?? null,
        tavilyApiKey: tavilyApiKey ?? null,
        theme: theme ?? "dark",
      })
      .returning();
    saved = inserted;
  }

  res.json(SaveSettingsResponse.parse({
    hasGeminiKey: !!(saved.geminiApiKey || process.env.GEMINI_API_KEY),
    hasElevenLabsKey: !!(saved.elevenLabsApiKey || process.env.ELEVEN_LABS_API_KEY),
    hasTavilyKey: !!(saved.tavilyApiKey || process.env.TAVILY_API_KEY),
    theme: saved.theme ?? "dark",
  }));
});

export default router;
