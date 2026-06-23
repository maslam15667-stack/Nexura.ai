import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, paymentsTable, usersTable, notificationsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ADMIN_EMAIL = "maslam15667@gmail.com";
const ADMIN_KEY   = "aslam72017";

function requireAdmin(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction): void {
  const key = req.headers["x-admin-key"] as string | undefined;
  if (key !== ADMIN_KEY) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

/* ── Notifications ── */
router.get("/admin/notifications", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(rows.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
});

router.post("/admin/notifications/:id/read", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id));
  res.json({ success: true });
});

router.post("/admin/notifications/read-all", requireAdmin, async (_req, res): Promise<void> => {
  await db.update(notificationsTable).set({ isRead: true });
  res.json({ success: true });
});

/* ── Payments ── */
router.get("/admin/payments", requireAdmin, async (_req, res): Promise<void> => {
  const payments = await db.select().from(paymentsTable).orderBy(desc(paymentsTable.createdAt));
  res.json(payments.map(p => ({
    id: p.id, utrNumber: p.utrNumber, status: p.status,
    approvedAt: p.approvedAt?.toISOString() ?? null,
    expiresAt: p.expiresAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/admin/payments/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const approvedAt = new Date();
  const expiresAt  = new Date(approvedAt.getTime() + 24 * 60 * 60 * 1000);
  const [payment] = await db.update(paymentsTable)
    .set({ status: "approved", approvedAt, expiresAt })
    .where(eq(paymentsTable.id, id))
    .returning();
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  req.log.info({ id, utr: payment.utrNumber }, "Payment approved");
  res.json({ id: payment.id, utrNumber: payment.utrNumber, status: payment.status, approvedAt: payment.approvedAt?.toISOString() ?? null, expiresAt: payment.expiresAt?.toISOString() ?? null, createdAt: payment.createdAt.toISOString() });
});

router.post("/admin/payments/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [payment] = await db.update(paymentsTable).set({ status: "rejected" }).where(eq(paymentsTable.id, id)).returning();
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }
  req.log.info({ id, utr: payment.utrNumber }, "Payment rejected");
  res.json({ id: payment.id, utrNumber: payment.utrNumber, status: payment.status, approvedAt: payment.approvedAt?.toISOString() ?? null, expiresAt: payment.expiresAt?.toISOString() ?? null, createdAt: payment.createdAt.toISOString() });
});

/* ── Users ── */
router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id, name: usersTable.name, email: usersTable.email,
      isPremium: usersTable.isPremium, premiumExpiresAt: usersTable.premiumExpiresAt,
      isBlocked: usersTable.isBlocked, dailyChatCount: usersTable.dailyChatCount,
      totalChatCount: usersTable.totalChatCount,
      lastChatDate: usersTable.lastChatDate, createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));
  res.json(users.map(u => ({
    ...u,
    premiumExpiresAt: u.premiumExpiresAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    isAdmin: u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  })));
});

router.post("/admin/users/:id/block", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    res.status(403).json({ error: "Cannot block the admin account" }); return;
  }
  await db.update(usersTable).set({ isBlocked: true, token: null }).where(eq(usersTable.id, id));
  logger.info({ id, email: user.email }, "User blocked");
  res.json({ success: true });
});

router.post("/admin/users/:id/unblock", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.update(usersTable).set({ isBlocked: false }).where(eq(usersTable.id, id));
  logger.info({ id }, "User unblocked");
  res.json({ success: true });
});

router.delete("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    res.status(403).json({ error: "Cannot delete the admin account" }); return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  logger.info({ id, email: user.email }, "User deleted");
  res.json({ success: true });
});

export default router;
