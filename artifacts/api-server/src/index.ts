import app from "./app";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { connectToMongoDB } from "./mongodb/connection";
import { mongoStorage } from "./mongodb/mongoStorage";
import { ExamBooking, Question } from "./mongodb/models";
import { gameWebSocketServer } from "./multiplayerRoutes";
import { startNotificationScheduler } from "./services/notificationService";
import { startPushScheduler } from "./services/pushService";
import { startAdminWhatsAppReportScheduler } from "./services/adminWhatsAppNotifications";
import { onWhatsAppMessage, restoreWhatsAppSession } from "./services/whatsappService";
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

async function seedMongoQuestionsIfEmpty() {
  if ((await Question.countDocuments()) > 0) return;

  const questionsPath = path.resolve(process.cwd(), "artifacts/api-server/server/questions.json");
  if (!fs.existsSync(questionsPath)) return;

  const raw = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
  const verbalCount = (raw.verbal || []).length;
  const questions = [...(raw.verbal || []), ...(raw.quantitative || [])].map(
    (question: any, index: number) => ({
      questionId: index + 1,
      category: index < verbalCount ? "verbal" : "quantitative",
      subcategory: question.category || "عام",
      text: question.text,
      options: question.options,
      correctOptionIndex: question.correctOptionIndex,
      difficulty: "intermediate",
      explanation: question.explanation || "",
      topic: question.category || "general",
      keywords: [question.category || "general"],
      section: index < verbalCount ? 1 : 2,
      dialect: "standard",
    }),
  );

  for (let index = 0; index < questions.length; index += 500) {
    await Question.insertMany(questions.slice(index, index + 500), {
      ordered: false,
    });
  }
}

try {
  if (await connectToMongoDB()) {
    await mongoStorage.initialize();
    void seedMongoQuestionsIfEmpty().catch((error) =>
      logger.warn({ error }, "Question seed failed"),
    );
  }
} catch (error) {
  logger.warn({ error }, "MongoDB unavailable; using fallback storage");
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

void restoreWhatsAppSession();
onWhatsAppMessage(async (message) => {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const { WhatsAppMessage } = await import("./mongodb/models");
    await WhatsAppMessage.updateOne({ messageId: message.messageId }, message, { upsert: true });
  } catch (error) {
    logger.error({ error }, "Could not persist incoming WhatsApp message");
  }
});
startNotificationScheduler();
startPushScheduler();
startAdminWhatsAppReportScheduler();

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
