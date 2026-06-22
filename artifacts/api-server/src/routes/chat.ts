import { Router, type IRouter } from "express";
import { eq, desc, and, isNull } from "drizzle-orm";
import { db, chatMessagesTable, usersTable } from "@workspace/db";
import {
  SendChatMessageBody,
  SendChatMessageResponse,
  GetChatHistoryQueryParams,
  GetChatHistoryResponse,
} from "@workspace/api-zod";
import { settingsTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { callGeminiWithFallback } from "../lib/gemini";

const router: IRouter = Router();

const CHAT_LIMIT = 10;

const CHARACTER_PROMPTS: Record<string, string> = {
  normal:   "You are NEXURA, a helpful and intelligent AI assistant. Respond helpfully and concisely.",
  tsundere: "You are a tsundere anime character. You are reluctant to help but ultimately do. Use phrases like 'It's not like I wanted to help you or anything!' Be slightly defensive.",
  waifu:    "You are a caring and affectionate anime waifu character. You are warm, loving, and refer to the user as 'master' or 'senpai'. Be sweet and supportive.",
  senpai:   "You are a wise and experienced senpai. You guide with patience and wisdom. Use 'Listen well, kouhai...' occasionally.",
  villain:  "You are a dramatic anime villain who has begrudgingly decided to help the user. Be theatrical, slightly menacing but ultimately informative.",
  yandere:  "You are a yandere anime character who is intensely devoted. Be passionate and slightly obsessive while providing helpful answers.",
  kuudere:  "You are a kuudere - cold and emotionally reserved on the outside but caring deep down. Be brief, precise, and occasionally show a hint of warmth.",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isPremiumActive(user: { isPremium: boolean; premiumExpiresAt: Date | null }): boolean {
  if (!user.isPremium) return false;
  if (!user.premiumExpiresAt) return false;
  return user.premiumExpiresAt > new Date();
}

async function getGeminiApiKey(): Promise<string | null> {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const [settings] = await db.select().from(settingsTable).limit(1);
  return settings?.geminiApiKey ?? null;
}

router.post("/chat/send", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, mode, sessionId } = parsed.data;
  const sid = sessionId ?? `session_${Date.now()}`;

  let userId: number | null = null;

  const authToken = req.headers.authorization?.replace("Bearer ", "");
  if (authToken) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.token, authToken)).limit(1);
    if (user) {
      if (user.isBlocked) {
        res.status(403).json({ error: "blocked", message: "Your account has been blocked. Contact support." });
        return;
      }
      const premiumActive = isPremiumActive(user);
      const today = todayStr();
      const todayCount = user.lastChatDate === today ? user.dailyChatCount : 0;

      if (!premiumActive && todayCount >= CHAT_LIMIT) {
        res.status(402).json({
          error: "limit_reached",
          message: `You've used all ${CHAT_LIMIT} free chats for today. Upgrade to NEXURA Premium for unlimited chats!`,
          chatsUsed: todayCount,
          limit: CHAT_LIMIT,
        });
        return;
      }

      await db.update(usersTable)
        .set({
          dailyChatCount: todayCount + 1,
          lastChatDate: today,
          totalChatCount: (user.totalChatCount ?? 0) + 1,
        })
        .where(eq(usersTable.id, user.id));

      userId = user.id;
    }
  }

  await db.insert(chatMessagesTable).values({
    userId,
    role: "user",
    content: message,
    sessionId: sid,
    mode: mode ?? "normal",
  });

  const apiKey = await getGeminiApiKey();
  let reply = "Please configure your Gemini API key in Settings to start chatting.";

  if (apiKey) {
    try {
      reply = await callGeminiWithFallback({
        system: CHARACTER_PROMPTS[mode ?? "normal"] ?? CHARACTER_PROMPTS.normal,
        prompt: message,
      }, apiKey);
    } catch (err: unknown) {
      logger.error({ err }, "Gemini API call failed");
      reply = err instanceof Error ? err.message : "Failed to get AI response. Please try again.";
    }
  }

  await db.insert(chatMessagesTable).values({
    userId,
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

  const authToken = req.headers.authorization?.replace("Bearer ", "");
  let userId: number | null = null;

  if (authToken) {
    const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.token, authToken)).limit(1);
    if (user) userId = user.id;
  }

  let messages;

  if (userId !== null) {
    const conditions = params.data.sessionId
      ? and(eq(chatMessagesTable.userId, userId), eq(chatMessagesTable.sessionId, params.data.sessionId))
      : eq(chatMessagesTable.userId, userId);

    messages = await db
      .select()
      .from(chatMessagesTable)
      .where(conditions)
      .orderBy(chatMessagesTable.createdAt)
      .limit(200);
  } else {
    messages = [];
  }

  res.json(GetChatHistoryResponse.parse(messages.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))));
});

export default router;
