import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, chatMessagesTable } from "@workspace/db";
import {
  SendChatMessageBody,
  SendChatMessageResponse,
  GetChatHistoryQueryParams,
  GetChatHistoryResponse,
} from "@workspace/api-zod";
import { settingsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CHARACTER_PROMPTS: Record<string, string> = {
  normal: "You are NEXURA, a helpful and intelligent AI assistant. Respond helpfully and concisely.",
  tsundere: "You are a tsundere anime character. You are reluctant to help but ultimately do. Use phrases like 'It's not like I wanted to help you or anything!' Be slightly defensive.",
  waifu: "You are a caring and affectionate anime waifu character. You are warm, loving, and refer to the user as 'master' or 'senpai'. Be sweet and supportive.",
  senpai: "You are a wise and experienced senpai. You guide with patience and wisdom. Use 'Listen well, kouhai...' occasionally.",
  villain: "You are a dramatic anime villain who has begrudgingly decided to help the user. Be theatrical, slightly menacing but ultimately informative.",
  yandere: "You are a yandere anime character who is intensely devoted. Be passionate and slightly obsessive while providing helpful answers.",
  kuudere: "You are a kuudere - cold and emotionally reserved on the outside but caring deep down. Be brief, precise, and occasionally show a hint of warmth.",
};

async function getGeminiApiKey(): Promise<string | null> {
  const [settings] = await db.select().from(settingsTable).limit(1);
  return settings?.geminiApiKey ?? process.env.GEMINI_API_KEY ?? null;
}

async function callGemini(prompt: string, apiKey: string, characterMode: string): Promise<string> {
  const systemInstruction = CHARACTER_PROMPTS[characterMode] ?? CHARACTER_PROMPTS.normal;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }
  const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "I couldn't generate a response.";
}

router.post("/chat/send", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, mode, sessionId } = parsed.data;
  const sid = sessionId ?? `session_${Date.now()}`;

  await db.insert(chatMessagesTable).values({
    role: "user",
    content: message,
    sessionId: sid,
    mode: mode ?? "normal",
  });

  const apiKey = await getGeminiApiKey();
  let reply = "Please configure your Gemini API key in Settings to start chatting.";

  if (apiKey) {
    try {
      reply = await callGemini(message, apiKey, mode ?? "normal");
    } catch (err) {
      logger.error({ err }, "Gemini API call failed");
      reply = "Failed to get AI response. Please check your Gemini API key.";
    }
  }

  await db.insert(chatMessagesTable).values({
    role: "assistant",
    content: reply,
    sessionId: sid,
    mode: mode ?? "normal",
  });

  res.json(SendChatMessageResponse.parse({ reply, sessionId: sid }));
});

router.get("/chat/history", async (req, res): Promise<void> => {
  const params = GetChatHistoryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = db
    .select()
    .from(chatMessagesTable)
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(100);

  let messages;
  if (params.data.sessionId) {
    messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, params.data.sessionId))
      .orderBy(chatMessagesTable.createdAt)
      .limit(100);
  } else {
    messages = await query;
  }

  res.json(GetChatHistoryResponse.parse(messages.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))));
});

export default router;
