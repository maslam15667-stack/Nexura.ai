import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { VoiceSpeakBody, VoiceSpeakResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { callGeminiWithFallback } from "../lib/gemini";

const router: IRouter = Router();

async function getSettings(): Promise<{ geminiKey: string | null; elevenLabsKey: string | null }> {
  const [settings] = await db.select().from(settingsTable).limit(1);
  return {
    geminiKey: settings?.geminiApiKey ?? process.env.GEMINI_API_KEY ?? null,
    elevenLabsKey: settings?.elevenLabsApiKey ?? process.env.ELEVEN_LABS_API_KEY ?? null,
  };
}

const CHARACTER_VOICE_PROMPTS: Record<string, Record<string, string>> = {
  tsundere: {
    angry:   "Hmph! It's not like I wanted to help you anyway! But fine, I'll tell you: ",
    soft:    "W-well, if you insist... I guess I'll say it softly just this once: ",
    cute:    "D-don't get the wrong idea! I just happen to know this: ",
    default: "I-it's not like I care but... ",
  },
  waifu: {
    soft:     "Welcome back, master~ I'm so happy you're here. Let me tell you: ",
    cute:     "Kyaa~ Of course, darling! ",
    energetic:"Oh, oh! I know this! Let me tell you right away~! ",
    default:  "For you, anything~ ",
  },
  senpai: {
    deep:    "Listen well, kouhai. I will tell you this wisdom: ",
    calm:    "Pay attention carefully. ",
    default: "As your senpai, hear my words: ",
  },
  villain: {
    deep:     "Muahahaha! You dare ask ME? Very well, I shall grant you this knowledge: ",
    energetic:"FOOL! Did you really think I wouldn't know?! Listen carefully: ",
    default:  "How... amusing that you come to me. I shall indulge your request: ",
  },
  yandere: {
    angry:   "How DARE you not know this?! I'll tell you and only YOU: ",
    whisper: "Just between us... come closer... ",
    default: "You're mine, and I'll tell only you: ",
  },
  kuudere: {
    calm:    "Understood. ",
    deep:    "..I will explain. ",
    default: "...Fine. ",
  },
};

function getCharacterPrefix(character: string, voiceType: string): string {
  const charPrompts = CHARACTER_VOICE_PROMPTS[character] ?? {};
  return charPrompts[voiceType] ?? charPrompts.default ?? "";
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  tamil:    "Reply in Tamil language.",
  hindi:    "Reply in Hindi language.",
  malayalam:"Reply in Malayalam language.",
  japanese: "Reply in Japanese language.",
  english:  "Reply in English language.",
  auto:     "Detect and reply in the same language as the input.",
};

router.post("/voice/speak", async (req, res): Promise<void> => {
  const parsed = VoiceSpeakBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { text, character, voiceType, language } = parsed.data;
  const { geminiKey, elevenLabsKey } = await getSettings();

  if (!geminiKey) {
    res.json(VoiceSpeakResponse.parse({
      audioUrl: null,
      characterResponse: "Please configure your Gemini API key in Settings to use AI Voice Call.",
      language: language ?? "english",
    }));
    return;
  }

  const prefix = getCharacterPrefix(character, voiceType);
  const langInstruction = LANGUAGE_INSTRUCTIONS[language] ?? LANGUAGE_INSTRUCTIONS.auto;

  let characterResponse = "";
  try {
    characterResponse = await callGeminiWithFallback({
      prompt: `You are a ${character} anime character with a ${voiceType} voice. ${langInstruction}
Respond to: "${text}"
Start your response with: "${prefix}"
Keep the response short (1-3 sentences) and in character.`,
    }, geminiKey);
  } catch (err) {
    logger.error({ err }, "Voice Gemini call failed");
    const msg = err instanceof Error ? err.message : "I couldn't respond right now.";
    characterResponse = prefix + msg;
  }

  let audioUrl: string | null = null;

  if (elevenLabsKey) {
    try {
      const VOICE_IDS: Record<string, string> = {
        soft:     "EXAVITQu4vr4xnSDxMaL",
        angry:    "VR6AewLTigWG4xSOukaG",
        cute:     "pFZP5JQG7iQjIQuC4Bku",
        deep:     "N2lVS1w4EtoT3dr4eOWO",
        whisper:  "jBpfuIE2acCO8z3wKNLl",
        energetic:"yoZ06aMxZJJ28mfd3POQ",
        calm:     "ErXwobaYiN019PkySvjV",
      };
      const voiceId = VOICE_IDS[voiceType] ?? VOICE_IDS.calm;

      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsKey,
        },
        body: JSON.stringify({
          text: characterResponse,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
        }),
      });

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        const base64 = Buffer.from(audioBuffer).toString("base64");
        audioUrl = `data:audio/mpeg;base64,${base64}`;
      }
    } catch (err) {
      logger.error({ err }, "ElevenLabs TTS failed");
    }
  }

  res.json(VoiceSpeakResponse.parse({
    audioUrl,
    characterResponse,
    language,
  }));
});

export default router;
