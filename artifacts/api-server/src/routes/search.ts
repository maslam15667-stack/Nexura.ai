import { Router, type IRouter } from "express";
import { WebSearchBody, WebSearchResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { callGeminiWithFallback } from "../lib/gemini";

const router: IRouter = Router();

function extractJsonArray(text: string): { title: string; url: string; snippet: string }[] {
  let clean = text.trim();
  // Strip markdown code fences
  clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // Find first [ ... ] block
  const start = clean.indexOf("[");
  const end   = clean.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const arr = JSON.parse(clean.slice(start, end + 1));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

router.post("/search", async (req, res): Promise<void> => {
  const parsed = WebSearchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query } = parsed.data;
  const openRouterKey = process.env.OPENROUTER_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!openRouterKey) {
    res.json(WebSearchResponse.parse({
      results: [{ title: "AI key not configured", snippet: "Please contact the admin.", url: "" }],
    }));
    return;
  }

  try {
    const aiText = await callGeminiWithFallback({
      system: `You are a web search engine assistant. Return ONLY a JSON array of 6 search results for any query.
Format: [{"title":"Page title","url":"https://example.com/page","snippet":"2-3 sentence description of what the page covers."}]
Rules: Use real website domains. Be accurate and helpful. No markdown, no explanation, ONLY the JSON array.`,
      prompt: query,
    }, openRouterKey);

    const results = extractJsonArray(aiText);

    if (results.length > 0) {
      res.json(WebSearchResponse.parse({
        results: results.slice(0, 8).map(r => ({
          title:   String(r.title   ?? "Result"),
          snippet: String(r.snippet ?? ""),
          url:     String(r.url     ?? ""),
        })),
      }));
      return;
    }

    // Fallback: return AI answer as single result
    res.json(WebSearchResponse.parse({
      results: [{ title: `AI Answer: ${query}`, snippet: aiText.slice(0, 500), url: "" }],
    }));
  } catch (err) {
    logger.error({ err }, "AI web search failed");
    res.json(WebSearchResponse.parse({
      results: [{ title: "Search failed", snippet: "AI is temporarily unavailable. Please try again shortly.", url: "" }],
    }));
  }
});

export default router;
