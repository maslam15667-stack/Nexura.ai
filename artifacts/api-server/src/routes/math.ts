import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { SolveMathBody, SolveMathResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { callGeminiWithFallback } from "../lib/gemini";

const router: IRouter = Router();

async function getGeminiApiKey(): Promise<string | null> {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const [settings] = await db.select().from(settingsTable).limit(1);
  return settings?.geminiApiKey ?? null;
}

router.post("/math/solve", async (req, res): Promise<void> => {
  const parsed = SolveMathBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { problem, imageBase64 } = parsed.data;
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
    const systemPrompt = `Solve this math problem step by step. Format your response as JSON with these fields:
- "steps": array of strings, each being a clear numbered step
- "answer": the final answer as a string
- "latex": optional LaTeX representation of the final answer

Respond ONLY with valid JSON, no markdown, no code blocks.`;

    const text = await callGeminiWithFallback({
      prompt: imageBase64
        ? systemPrompt + "\n\nSolve the math problem shown in this image:"
        : systemPrompt + `\n\nProblem: ${problem}`,
      jsonMode: true,
      imageParts: imageBase64
        ? [{ inline_data: { mime_type: "image/jpeg", data: imageBase64 } }]
        : undefined,
    }, apiKey);

    let parsedSolution: { steps?: unknown; answer?: unknown; latex?: unknown } = {};
    try {
      parsedSolution = JSON.parse(text);
    } catch {
      parsedSolution = { steps: [text], answer: "See above", latex: null };
    }

    res.json(SolveMathResponse.parse({
      steps: Array.isArray(parsedSolution.steps) ? parsedSolution.steps : [String(parsedSolution.steps ?? text)],
      answer: String(parsedSolution.answer ?? "See steps above"),
      latex: parsedSolution.latex ? String(parsedSolution.latex) : null,
    }));
  } catch (err) {
    logger.error({ err }, "Math solver failed");
    const msg = err instanceof Error ? err.message : "Error solving the problem. Please try again.";
    res.json(SolveMathResponse.parse({
      steps: [msg],
      answer: "Error",
      latex: null,
    }));
  }
});

export default router;
