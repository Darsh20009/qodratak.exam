import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getConnectionStatus } from "../mongodb/connection";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const mongodbConnected = getConnectionStatus();
  const data = HealthCheckResponse.parse({
    status: mongodbConnected ? "ok" : "unhealthy",
    mongodb: mongodbConnected ? "connected" : "disconnected",
  });
  res.set("Cache-Control", "no-store");
  res.status(mongodbConnected ? 200 : 503).json(data);
});

export default router;
