import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { SolveMathBody, SolveMathResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function getGeminiApiKey(): Promise<string | null> {
  const [settings] = await db.select().from(settingsTable).limit(1);
  return settings?.geminiApiKey ?? process.env.GEMINI_API_KEY ?? null;
}

router.post("/math/solve", async (req, res): Promise<void> => {
  const parsed = SolveMathBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { problem } = parsed.data;
  const apiKey = await getGeminiApiKey();

  if (!apiKey) {
    res.json(SolveMathResponse.parse({
      steps: ["Please configure your Gemini API key in Settings to use Math Solver."],
      answer: "API key required",
      latex: null,
    }));
    return;
  }

  try {
    const prompt = `Solve this math problem step by step. Format your response as JSON with these fields:
- "steps": array of strings, each being a numbered step
- "answer": the final answer as a string
- "latex": optional LaTeX representation of the final answer

Problem: ${problem}

Respond ONLY with valid JSON, no markdown, no code blocks.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const parsed2 = JSON.parse(text);

    res.json(SolveMathResponse.parse({
      steps: Array.isArray(parsed2.steps) ? parsed2.steps : [text],
      answer: parsed2.answer ?? "See steps above",
      latex: parsed2.latex ?? null,
    }));
  } catch (err) {
    logger.error({ err }, "Math solver failed");
    res.json(SolveMathResponse.parse({
      steps: ["Error solving the problem. Please try again."],
      answer: "Error",
      latex: null,
    }));
  }
});

export default router;
