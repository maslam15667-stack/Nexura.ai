import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isPremiumActive(user: { isPremium: boolean; premiumExpiresAt: Date | null }): boolean {
  if (!user.isPremium) return false;
  if (!user.premiumExpiresAt) return false;
  return user.premiumExpiresAt > new Date();
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    res.status(400).json({ error: "Name, email and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }
  try {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const token = randomBytes(32).toString("hex");
    const [user] = await db.insert(usersTable).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      token,
    }).returning();
    res.status(201).json({ token, name: user.name, email: user.email, id: user.id });
  } catch (err) {
    logger.error({ err }, "Register failed");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email?.trim() || !password?.trim()) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = randomBytes(32).toString("hex");
    await db.update(usersTable).set({ token }).where(eq(usersTable.id, user.id));
    res.json({ token, name: user.name, email: user.email, id: user.id });
  } catch (err) {
    logger.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "No token" }); return; }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.token, token)).limit(1);
    if (!user) { res.status(401).json({ error: "Invalid token" }); return; }

    const active = isPremiumActive(user);

    if (user.isPremium && !active) {
      await db.update(usersTable).set({ isPremium: false }).where(eq(usersTable.id, user.id));
    }

    const today = todayStr();
    const chatsToday = user.lastChatDate === today ? user.dailyChatCount : 0;

    res.json({
      name: user.name,
      email: user.email,
      id: user.id,
      isPremium: active,
      premiumExpiresAt: user.premiumExpiresAt?.toISOString() ?? null,
      chatsToday,
      chatLimit: 10,
    });
  } catch (err) {
    res.status(500).json({ error: "Auth check failed" });
  }
});

router.post("/auth/activate-premium", async (req, res): Promise<void> => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "No token" }); return; }
  const { utrNumber } = req.body as { utrNumber?: string };
  if (!utrNumber?.trim()) {
    res.status(400).json({ error: "UPI transaction ID is required" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.token, token)).limit(1);
    if (!user) { res.status(401).json({ error: "Invalid token" }); return; }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.update(usersTable)
      .set({ isPremium: true, premiumExpiresAt: expiresAt })
      .where(eq(usersTable.id, user.id));

    logger.info({ userId: user.id, email: user.email, utrNumber, expiresAt }, "User activated premium");
    res.json({
      success: true,
      message: "Premium activated! Enjoy unlimited chats for 24 hours.",
      premiumExpiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Activate premium failed");
    res.status(500).json({ error: "Failed to activate premium" });
  }
});

export default router;
