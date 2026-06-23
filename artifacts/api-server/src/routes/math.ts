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

const SYSTEM_PROMPT = `You are an expert math tutor. Your job is to solve math problems in a very clear, simple, step-by-step way that any student can understand.

IMPORTANT RULES:
1. If given an image, ONLY read the QUESTION or PROBLEM — completely IGNORE any written answers, solutions, or working already shown in the image. Extract only the unsolved question.
2. Break every solution into small, numbered steps. Each step must explain WHAT you are doing and WHY.
3. Use simple, plain English in every step — no unnecessary jargon.
4. Give the EXACT final answer clearly.
5. If the image has multiple questions, solve each one separately with clear headers like "Question 1:", "Question 2:", etc.
6. For equations: show each algebraic manipulation clearly.
7. For word problems: first identify the key information, then form the equation, then solve.

Respond ONLY with valid JSON (no markdown, no code blocks) in this exact format:
{
  "extractedQuestion": "the math question(s) you found in the image or text",
  "steps": ["Step 1: ...", "Step 2: ...", ...],
  "answer": "exact final answer",
  "latex": "optional LaTeX of answer or null"
}`;

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
    const prompt = imageBase64
      ? `${SYSTEM_PROMPT}\n\nLook at this image. Extract ONLY the math question (ignore any written answers already in the image). Then solve it step by step.`
      : `${SYSTEM_PROMPT}\n\nSolve this math problem step by step:\n${problem}`;

    const text = await callGeminiWithFallback({
      prompt,
      jsonMode: true,
      imageParts: imageBase64
        ? [{ inline_data: { mime_type: "image/jpeg", data: imageBase64 } }]
        : undefined,
    }, apiKey);

    let parsed2: { extractedQuestion?: unknown; steps?: unknown; answer?: unknown; latex?: unknown } = {};
    try {
      parsed2 = JSON.parse(text);
    } catch {
      parsed2 = { steps: [text], answer: "See above", latex: null };
    }

    res.json(SolveMathResponse.parse({
      steps: Array.isArray(parsed2.steps) ? parsed2.steps : [String(parsed2.steps ?? text)],
      answer: String(parsed2.answer ?? "See steps above"),
      latex: parsed2.latex ? String(parsed2.latex) : null,
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
