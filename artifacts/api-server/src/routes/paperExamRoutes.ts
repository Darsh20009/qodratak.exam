import type { Express, Request, RequestHandler, Response } from "express";
import {
  PaperExamService,
  PaperExamServiceError,
  paperExamQuestionPlan,
  validatePaperExamConfig,
  type PaperExamConfig,
  type PaperExamQuestionCandidate,
} from "../services/paperExamService";
import type { PaperExamHistoryInput } from "../services/paperExamResultHistory";

type PaperExamRouteApp = Pick<Express, "get" | "post" | "put">;

interface PaperExamRouteDependencies {
  requireAuth: RequestHandler;
  requireStudent: RequestHandler;
  service: PaperExamService;
  loadCandidates: (config: PaperExamConfig) => Promise<PaperExamQuestionCandidate[][]>;
  saveResultToHistory: (input: PaperExamHistoryInput) => Promise<unknown>;
}

function currentUserId(req: Request): string {
  return String((req as any).session?.userId || "");
}

function attemptId(req: Request): string {
  const value = req.params.id;
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function respondWithError(res: Response, error: unknown) {
  if (error instanceof PaperExamServiceError) {
    const status = {
      INVALID: 400,
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      EXPIRED: 410,
      CLOSED: 409,
      INSUFFICIENT_QUESTIONS: 422,
    }[error.code];
    return res.status(status).json({ error: error.message, code: error.code });
  }
  console.error("[Paper exam] Request failed:", error);
  return res.status(500).json({ error: "تعذر تنفيذ طلب الاختبار الورقي" });
}

export function registerPaperExamRoutes(
  app: PaperExamRouteApp,
  dependencies: PaperExamRouteDependencies,
) {
  const middleware = [dependencies.requireAuth, dependencies.requireStudent] as const;

  app.post("/api/paper-exams", ...middleware, async (req, res) => {
    try {
      const ownerUserId = currentUserId(req);
      if (!ownerUserId) return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });

      const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
      if (["userId", "ownerUserId", "questions", "answerKey", "correctOptionIndex", "answers"].some((key) => key in body)) {
        return res.status(400).json({ error: "لا يمكن إرسال هوية الطالب أو الأسئلة أو مفتاح الإجابة من المتصفح" });
      }

      const config = validatePaperExamConfig(body);
      const plan = paperExamQuestionPlan(config);
      const candidatesByBucket = await dependencies.loadCandidates(config);
      if (candidatesByBucket.length !== plan.length) {
        throw new PaperExamServiceError("INSUFFICIENT_QUESTIONS", "تعذر تجهيز توزيع الأسئلة المطلوب");
      }
      const state = await dependencies.service.create({ ownerUserId, config, candidatesByBucket });
      return res.status(201).json(state);
    } catch (error) {
      return respondWithError(res, error);
    }
  });

  app.get("/api/paper-exams/:id", ...middleware, async (req, res) => {
    try {
      const ownerUserId = currentUserId(req);
      if (!ownerUserId) return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
      return res.json(await dependencies.service.get(attemptId(req), ownerUserId));
    } catch (error) {
      return respondWithError(res, error);
    }
  });

  app.get("/api/paper-exams/:id/questions", ...middleware, async (req, res) => {
    try {
      const ownerUserId = currentUserId(req);
      if (!ownerUserId) return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
      const state = await dependencies.service.get(attemptId(req), ownerUserId);
      return res.json(state.questions);
    } catch (error) {
      return respondWithError(res, error);
    }
  });

  app.put("/api/paper-exams/:id/answers", ...middleware, async (req, res) => {
    try {
      const ownerUserId = currentUserId(req);
      if (!ownerUserId) return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
      return res.json(await dependencies.service.saveAnswers({
        id: attemptId(req),
        ownerUserId,
        answers: req.body?.answers,
        reviewQuestionNumbers: req.body?.reviewQuestionNumbers,
      }));
    } catch (error) {
      return respondWithError(res, error);
    }
  });

  app.post("/api/paper-exams/:id/submit", ...middleware, async (req, res) => {
    try {
      const ownerUserId = currentUserId(req);
      if (!ownerUserId) return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
      const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
      if (Object.keys(body).length > 0) {
        return res.status(400).json({ error: "التسليم لا يقبل درجة أو إجابات من العميل؛ احفظ الإجابات أولاً" });
      }
      const id = attemptId(req);
      const submission = await dependencies.service.submit(id, ownerUserId);
      const state = await dependencies.service.get(id, ownerUserId);
      await dependencies.saveResultToHistory({
        attemptId: id,
        ownerUserId,
        title: state.exam.title,
        program: state.exam.program,
        subjectId: state.exam.subjectId,
        timeLimitMinutes: state.exam.timeLimit,
        submittedAt: new Date(),
        result: submission.result,
      });
      return res.json(submission);
    } catch (error) {
      return respondWithError(res, error);
    }
  });
}
