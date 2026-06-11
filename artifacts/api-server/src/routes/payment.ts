import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, paymentsTable } from "@workspace/db";
import {
  SubmitPaymentBody,
  SubmitPaymentResponse,
  GetPaymentStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/payment/submit", async (req, res): Promise<void> => {
  const parsed = SubmitPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { utrNumber } = parsed.data;

  const [payment] = await db
    .insert(paymentsTable)
    .values({ utrNumber, status: "pending" })
    .returning();

  res.json(SubmitPaymentResponse.parse({
    status: payment.status,
    approvedAt: payment.approvedAt?.toISOString() ?? null,
    expiresAt: payment.expiresAt?.toISOString() ?? null,
    utrNumber: payment.utrNumber,
  }));
});

router.get("/payment/status", async (req, res): Promise<void> => {
  const [latest] = await db
    .select()
    .from(paymentsTable)
    .orderBy(desc(paymentsTable.createdAt))
    .limit(1);

  if (!latest) {
    res.json(GetPaymentStatusResponse.parse({
      status: "none",
      approvedAt: null,
      expiresAt: null,
      utrNumber: null,
    }));
    return;
  }

  const now = new Date();
  let status = latest.status;

  if (status === "approved" && latest.expiresAt && latest.expiresAt < now) {
    status = "expired";
    await db
      .update(paymentsTable)
      .set({ status: "expired" })
      .where(eq(paymentsTable.id, latest.id));
  }

  res.json(GetPaymentStatusResponse.parse({
    status,
    approvedAt: latest.approvedAt?.toISOString() ?? null,
    expiresAt: latest.expiresAt?.toISOString() ?? null,
    utrNumber: latest.utrNumber,
  }));
});

export default router;
