import { logger } from "./logger";

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const OPENROUTER_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-flash-1.5-8b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

export interface GeminiRequest {
  system?: string;
  prompt: string;
  jsonMode?: boolean;
  imageParts?: { inline_data: { mime_type: string; data: string } }[];
}

async function callOpenRouter(req: GeminiRequest, apiKey: string): Promise<string> {
  const messages: { role: string; content: unknown }[] = [];

  if (req.system) {
    messages.push({ role: "system", content: req.system });
  }

  if (req.imageParts && req.imageParts.length > 0) {
    const content: unknown[] = [{ type: "text", text: req.prompt }];
    for (const part of req.imageParts) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`,
        },
      });
    }
    messages.push({ role: "user", content });
  } else {
    messages.push({ role: "user", content: req.prompt });
  }

  for (const model of OPENROUTER_MODELS) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://nexura.app",
        "X-Title": "NEXURA AI",
      },
      body: JSON.stringify({
        model,
        messages,
        ...(req.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (response.ok) {
      const data = await response.json() as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string };
      };
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text;
    }

    const status = response.status;
    if (status === 429) {
      logger.warn({ model }, `OpenRouter quota hit on ${model}, trying next`);
      continue;
    }
    if (status === 401 || status === 403) {
      throw new Error("Your OpenRouter API key is invalid. Please update it in Settings.");
    }

    logger.warn({ model, status }, "OpenRouter model failed, trying next");
  }

  throw new Error("AI is temporarily unavailable. Please try again in a moment.");
}

async function callGeminiDirect(req: GeminiRequest, apiKey: string): Promise<string> {
  for (const model of GEMINI_MODELS) {
    const parts: object[] = req.imageParts
      ? [{ text: req.prompt }, ...req.imageParts]
      : [{ text: req.prompt }];

    const body: Record<string, unknown> = { contents: [{ parts }] };
    if (req.system) body.system_instruction = { parts: [{ text: req.system }] };
    if (req.jsonMode) body.generationConfig = { responseMimeType: "application/json" };

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

    const status = response.status;
    if (status === 429) {
      logger.warn({ model }, `Gemini quota hit on ${model}, trying next`);
      continue;
    }
    if (status === 401 || status === 403) {
      throw new Error("Your Gemini API key is invalid or expired. Please update it in Settings.");
    }

    const body2 = await response.text();
    logger.error({ status, body: body2 }, "Gemini API error");
    throw new Error(`AI error (${status}). Please try again.`);
  }

  throw new Error("Gemini AI quota exhausted. Please try again in a minute.");
}

export async function callGeminiWithFallback(
  req: GeminiRequest,
  apiKey: string
): Promise<string> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (openRouterKey) {
    try {
      return await callOpenRouter(req, openRouterKey);
    } catch (err) {
      logger.error({ err }, "OpenRouter call failed");
      throw err;
    }
  }

  return callGeminiDirect(req, apiKey);
}

export async function getAiApiKey(): Promise<string | null> {
  return (
    process.env.OPENROUTER_API_KEY ??
    process.env.GEMINI_API_KEY ??
    null
  );
}
