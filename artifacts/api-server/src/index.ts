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

async function ensureCubeVolumeQuestion() {
  const text = "مكعب طول حرفه ٢ سم، وُضع فيه مكعب طول حرفه ١ سم. ما الحجم المتبقي من المكعب الأول؟";
  const exists = await Question.exists({ text });
  if (exists) return;

  const lastQuestion = await Question.findOne().sort({ questionId: -1 }).select({ questionId: 1 }).lean();
  await Question.create({
    questionId: Math.max(Number(lastQuestion?.questionId || 0) + 1, 2153),
    category: "quantitative",
    subcategory: "الهندسة",
    text,
    options: ["١", "٥", "٦", "٧"],
    correctOptionIndex: 3,
    difficulty: "beginner",
    topic: "المجسمات والحجوم",
    dialect: "standard",
    keywords: ["الهندسة", "المجسمات", "الحجوم", "حجم المكعب"],
    section: 2,
    explanation: "حجم المكعب الأول = ٢³ = ٨ سم³، وحجم المكعب الصغير = ١³ = ١ سم³. الحجم المتبقي = ٨ - ١ = ٧ سم³.",
    imageUrl: "/api/uploads/question-images/q-img-cube-volume-no-bg.png",
    imageProcessing: {
      status: "processed",
      backgroundRemoved: true,
      watermarkCleanupApplied: true,
      note: "تمت إزالة الخلفية الفاتحة من نسخة السؤال المرفقة مع الاحتفاظ بنسخة نصية قابلة للبحث.",
    },
    createdAt: new Date(),
    createdBy: "system",
  });
  console.log("✅ Added cube volume question to MongoDB");
}

try {
  if (await connectToMongoDB()) {
    await mongoStorage.initialize();
    await ensureCubeVolumeQuestion();
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
