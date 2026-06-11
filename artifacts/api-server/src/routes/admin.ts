import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, paymentsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/admin/payments", async (req, res): Promise<void> => {
  const payments = await db
    .select()
    .from(paymentsTable)
    .orderBy(desc(paymentsTable.createdAt));

  res.json(payments.map(p => ({
    id: p.id,
    utrNumber: p.utrNumber,
    status: p.status,
    approvedAt: p.approvedAt?.toISOString() ?? null,
    expiresAt: p.expiresAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/admin/payments/:id/approve", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const approvedAt = new Date();
  const expiresAt  = new Date(approvedAt.getTime() + 24 * 60 * 60 * 1000);

  const [payment] = await db
    .update(paymentsTable)
    .set({ status: "approved", approvedAt, expiresAt })
    .where(eq(paymentsTable.id, id))
    .returning();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  req.log.info({ id, utr: payment.utrNumber }, "Payment approved");
  res.json({
    id: payment.id,
    utrNumber: payment.utrNumber,
    status: payment.status,
    approvedAt: payment.approvedAt?.toISOString() ?? null,
    expiresAt: payment.expiresAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  });
});

router.post("/admin/payments/:id/reject", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [payment] = await db
    .update(paymentsTable)
    .set({ status: "rejected" })
    .where(eq(paymentsTable.id, id))
    .returning();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  req.log.info({ id, utr: payment.utrNumber }, "Payment rejected");
  res.json({
    id: payment.id,
    utrNumber: payment.utrNumber,
    status: payment.status,
    approvedAt: payment.approvedAt?.toISOString() ?? null,
    expiresAt: payment.expiresAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  });
});

export default router;
