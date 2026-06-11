import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import mathRouter from "./math";
import searchRouter from "./search";
import imageRouter from "./image";
import paymentRouter from "./payment";
import promptsRouter from "./prompts";
import voiceRouter from "./voice";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(mathRouter);
router.use(searchRouter);
router.use(imageRouter);
router.use(paymentRouter);
router.use(promptsRouter);
router.use(voiceRouter);
router.use(settingsRouter);

export default router;
