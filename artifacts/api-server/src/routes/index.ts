import { Router, type IRouter } from "express";
import healthRouter from "./health";
import supportTicketsRouter from "./supportTickets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(supportTicketsRouter);

export default router;
