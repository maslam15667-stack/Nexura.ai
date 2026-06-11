import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { WebSearchBody, WebSearchResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function getTavilyApiKey(): Promise<string | null> {
  const [settings] = await db.select().from(settingsTable).limit(1);
  return settings?.tavilyApiKey ?? process.env.TAVILY_API_KEY ?? null;
}

router.post("/search", async (req, res): Promise<void> => {
  const parsed = WebSearchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query } = parsed.data;
  const apiKey = await getTavilyApiKey();

  if (!apiKey) {
    res.json(WebSearchResponse.parse({
      results: [
        {
          title: "Tavily API Key Required",
          snippet: "Please configure your Tavily API key in Settings to use Web Search.",
          url: "https://tavily.com",
        },
      ],
    }));
    return;
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 8,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily error: ${response.status}`);
    }

    const data = await response.json() as { results?: { title?: string; content?: string; url?: string }[] };
    const results = (data.results ?? []).map(r => ({
      title: r.title ?? "No title",
      snippet: r.content ?? "",
      url: r.url ?? "",
    }));

    res.json(WebSearchResponse.parse({ results }));
  } catch (err) {
    logger.error({ err }, "Web search failed");
    res.json(WebSearchResponse.parse({
      results: [{ title: "Search failed", snippet: "An error occurred during the search.", url: "" }],
    }));
  }
});

export default router;
