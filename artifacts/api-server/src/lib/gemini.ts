import { logger } from "./logger";

const MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

export function getGeminiErrorMessage(status: number, body: string): string {
  if (status === 400) return "Invalid request to Gemini. Please update your API key in Settings.";
  if (status === 401 || status === 403) return "Your Gemini API key is invalid or expired. Please update it in Settings.";
  if (status === 429) return "Gemini AI is busy right now (rate limit). Please try again in a minute.";
  if (status >= 500) return "Gemini servers are temporarily unavailable. Please try again shortly.";
  return `Gemini error (${status}). Please try again.`;
}

export interface GeminiRequest {
  system?: string;
  prompt: string;
  jsonMode?: boolean;
  imageParts?: { inline_data: { mime_type: string; data: string } }[];
}

export async function callGeminiWithFallback(
  req: GeminiRequest,
  apiKey: string
): Promise<string> {
  let lastStatus = 0;
  let lastBody = "";

  for (const model of MODELS) {
    const parts: object[] = req.imageParts
      ? [{ text: req.prompt }, ...req.imageParts]
      : [{ text: req.prompt }];

    const body: Record<string, unknown> = {
      contents: [{ parts }],
    };

    if (req.system) {
      body.system_instruction = { parts: [{ text: req.system }] };
    }

    if (req.jsonMode) {
      body.generationConfig = { responseMimeType: "application/json" };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (response.ok) {
      const data = await response.json() as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
      return "";
    }

    lastStatus = response.status;
    lastBody = await response.text();

    if (lastStatus === 429) {
      logger.warn({ model }, `Gemini quota hit on ${model}, trying next model`);
      continue;
    }

    break;
  }

  const msg = getGeminiErrorMessage(lastStatus, lastBody);
  logger.error({ status: lastStatus, body: lastBody }, "Gemini all models failed");
  throw Object.assign(new Error(msg), { status: lastStatus });
}
