import app from "./app";
import mongoose from "mongoose";
import { connectToMongoDB } from "./mongodb/connection";
import { mongoStorage } from "./mongodb/mongoStorage";
import { ExamBooking } from "./mongodb/models";
import { gameWebSocketServer } from "./multiplayerRoutes";
import { startNotificationScheduler } from "./services/notificationService";
import { startPushScheduler } from "./services/pushService";
import { notifyAdminIncomingEmail, startAdminWhatsAppReportScheduler } from "./services/adminWhatsAppNotifications";
import { onWhatsAppMessage, restoreWhatsAppSession } from "./services/whatsappService";
import { startIncomingEmailWatcher } from "./services/emailInboxService";
import { storage } from "./storage";
import { chatWebSocketServer } from "./websocket";
import { logger } from "./lib/logger";
import { registerRoutes } from "./routes/routes";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

try {
  if (await connectToMongoDB()) {
    await mongoStorage.initialize();
  }
} catch (error) {
  logger.warn({ error }, "MongoDB unavailable; using fallback storage");
  if (process.env.MONGODB_URI || process.env.NODE_ENV === "production") {
    throw error;
  }
}

const server = await registerRoutes(app);
chatWebSocketServer.initialize(server);
gameWebSocketServer.initialize(server);

server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "/", "http://localhost").pathname;
  const target =
    pathname === "/ws/chat" || pathname === "/api/ws/chat"
      ? chatWebSocketServer.wss
      : pathname === "/ws/game" || pathname === "/api/ws/game"
        ? gameWebSocketServer.wss
        : null;

  if (!target) {
    socket.destroy();
    return;
  }

  target.handleUpgrade(request, socket, head, (webSocket) => {
    target.emit("connection", webSocket, request);
  });
});

server.listen(port, () => {
  logger.info({ port }, "Server listening");
});

onWhatsAppMessage(async (message) => {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const { WhatsAppMessage } = await import("./mongodb/models");
    await WhatsAppMessage.updateOne({ messageId: message.messageId }, message, { upsert: true });
  } catch (error) {
    logger.error({ error }, "Could not persist incoming WhatsApp message");
  }
});
void restoreWhatsAppSession();
startNotificationScheduler();
startPushScheduler();
startAdminWhatsAppReportScheduler();
startIncomingEmailWatcher((message) =>
  notifyAdminIncomingEmail({
    from: message.from,
    subject: message.subject,
    text: message.text,
  }).catch((error) => {
    logger.error({ error }, "Could not forward incoming email to admin WhatsApp");
  }),
);

setInterval(() => {
  storage.updateBotStudentsPoints();
}, 5 * 60 * 1000);

setInterval(async () => {
  try {
    const expiredCutoff = new Date(Date.now() - 60 * 60 * 1000);
    await ExamBooking.updateMany(
      {
        status: { $in: ["pending", "active"] },
        scheduledAt: { $lt: expiredCutoff },
      },
      { status: "cancelled" },
    );
  } catch {
    // MongoDB is optional in local fallback mode.
  }
}, 5 * 60 * 1000);
