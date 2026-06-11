import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, promptsTable } from "@workspace/db";
import {
  CreatePromptBody,
  UpdatePromptParams,
  UpdatePromptBody,
  DeletePromptParams,
  ListPromptsResponse,
  UpdatePromptResponse,
  DeletePromptResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const PRESET_PROMPTS = [
  { name: "Write Resume", text: "Write a professional resume for a [Job Title] with [X years] of experience in [Industry]. Include a summary, skills, experience, and education sections." },
  { name: "YouTube Script", text: "Write an engaging YouTube video script about [topic]. Include a hook, main content with timestamps, and a call-to-action at the end." },
  { name: "Exam Notes", text: "Create comprehensive study notes for [subject/topic]. Organize by key concepts, definitions, important formulas, and practice questions." },
  { name: "Debug Code", text: "Debug the following code and explain what's wrong and how to fix it: [paste code here]" },
  { name: "Write Email", text: "Write a professional email to [recipient] regarding [subject]. Tone should be [formal/casual]. Key points to include: [points]" },
  { name: "Study Plan", text: "Create a 4-week study plan for [exam/subject]. Include daily goals, topics to cover, and revision strategies." },
  { name: "Business Idea", text: "Analyze this business idea: [idea]. Cover market opportunity, target audience, revenue model, key challenges, and next steps." },
  { name: "Social Media Post", text: "Write 5 engaging social media posts for [platform] about [topic/product]. Include hashtags and call-to-action." },
  { name: "Cover Letter", text: "Write a compelling cover letter for [job position] at [company]. Highlight [key skills] and explain why I'm the perfect fit." },
  { name: "Python Script", text: "Write a Python script that [description of what the script should do]. Include error handling and comments." },
  { name: "Essay Introduction", text: "Write a compelling introduction paragraph for an essay about [topic]. Include a hook, background info, and thesis statement." },
  { name: "Meeting Summary", text: "Summarize the following meeting notes into key decisions, action items, and next steps: [paste meeting notes]" },
  { name: "Product Description", text: "Write a compelling product description for [product name]. Highlight key features, benefits, and target audience. Include a call-to-action." },
  { name: "Data Analysis", text: "Analyze the following data and provide insights, trends, and recommendations: [paste data or description]" },
  { name: "Story Starter", text: "Write an engaging story opening (3 paragraphs) in the [genre] genre. Setting: [setting]. Main character: [character description]." },
  { name: "Explain Concept", text: "Explain [complex concept] in simple terms that a beginner can understand. Use analogies and examples." },
  { name: "Interview Prep", text: "Prepare me for a [Job Title] interview. Generate 10 likely questions with ideal answers based on [job description]." },
  { name: "Workout Plan", text: "Create a [X]-week workout plan for [goal: weight loss/muscle gain/endurance]. I can train [X] days per week. Equipment available: [equipment]." },
  { name: "Recipe Creator", text: "Create a detailed recipe for [dish name]. Include ingredients, step-by-step instructions, cooking time, and serving suggestions." },
  { name: "Translation", text: "Translate the following text to [target language] and maintain the original tone and meaning: [paste text]" },
];

async function ensurePresetsExist(): Promise<void> {
  const existing = await db.select().from(promptsTable).where(eq(promptsTable.isPreset, true));
  if (existing.length === 0) {
    await db.insert(promptsTable).values(
      PRESET_PROMPTS.map(p => ({ ...p, isPreset: true }))
    );
  }
}

router.get("/prompts", async (req, res): Promise<void> => {
  await ensurePresetsExist();
  const prompts = await db.select().from(promptsTable).orderBy(promptsTable.createdAt);
  res.json(ListPromptsResponse.parse(prompts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))));
});

router.post("/prompts", async (req, res): Promise<void> => {
  const parsed = CreatePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [prompt] = await db
    .insert(promptsTable)
    .values({ ...parsed.data, isPreset: false })
    .returning();

  res.status(201).json({
    ...prompt,
    createdAt: prompt.createdAt.toISOString(),
  });
});

router.patch("/prompts/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePromptParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePromptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [prompt] = await db
    .update(promptsTable)
    .set(parsed.data)
    .where(eq(promptsTable.id, params.data.id))
    .returning();

  if (!prompt) {
    res.status(404).json({ error: "Prompt not found" });
    return;
  }

  res.json(UpdatePromptResponse.parse({
    ...prompt,
    createdAt: prompt.createdAt.toISOString(),
  }));
});

router.delete("/prompts/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePromptParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(promptsTable).where(eq(promptsTable.id, params.data.id));

  res.json(DeletePromptResponse.parse({ success: true }));
});

export default router;
