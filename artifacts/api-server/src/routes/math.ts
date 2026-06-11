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

    let requestBody: object;

    if (imageBase64) {
      requestBody = {
        contents: [{
          parts: [
            { text: systemPrompt + "\n\nSolve the math problem shown in this image:" },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64,
              }
            }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" },
      };
    } else {
      requestBody = {
        contents: [{ parts: [{ text: systemPrompt + `\n\nProblem: ${problem}` }] }],
        generationConfig: { responseMimeType: "application/json" },
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      logger.error({ status: response.status, body: errText }, "Gemini math error");
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

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
    res.json(SolveMathResponse.parse({
      steps: ["Error solving the problem. Please check your API key and try again."],
      answer: "Error",
      latex: null,
    }));
  }
});

export default router;
