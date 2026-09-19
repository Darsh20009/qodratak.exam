import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Types
export interface StudentDashboard {
  stats: { totalTests: number; averageScore: number; points: number };
  progress: {
    overall: { percentage: number; tests: number; questions: number };
    qudrat: { percentage: number; tests: number; questions: number };
    verbal: { percentage: number; tests: number; questions: number };
    quantitative: { percentage: number; tests: number; questions: number };
    tahsili: { percentage: number; tests: number; questions: number };
  };
  recentTests: Array<{ id: string; title: string; score: number; date: string; type: string }>;
  weaknesses: Array<{ subject: string; topic: string; errorRate: number }>;
  upcomingExam: { date: string | null; targetScore?: number };
  recommendedPlan: {
    title: string;
    description: string;
    nextAction: { label: string; href: string };
    focusSubject?: "verbal" | "quantitative";
    program?: "qudrat" | "tahsili";
  };
  officialScores: {
    verbal?: number;
    quantitative?: number;
    program?: "qudrat" | "tahsili";
    updatedAt?: string;
  } | null;
  subscription: { type: string; status: string; daysLeft: number };
  trial: { isActive: boolean; daysLeft: number } | null;
  booksCount: number;
  foldersCount: number;
}

export interface FoundationContent {
  _id: string;
  program: 'qudrat' | 'tahsili';
  subjectId?: string;
  taxonomyNodeId?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  order: number;
  linkedQuizRoute?: string;
  durationMinutes?: number;
  quiz?: {
    title: string;
    instructions?: string;
    passingScore: number;
    timeLimitMinutes?: number;
    questionIds: Array<{
      _id: string;
      questionId?: number;
      text: string;
      options: string[];
      imageUrl?: string;
      imageUrls?: string[];
      explanation?: string;
    }>;
  };
}

export interface LearningContentSection {
  id: string;
  type: string;
  title?: string;
  body?: string;
  problem?: string;
  thinking?: string;
  solution?: string;
  why?: string;
}

export interface LearningContentDocument {
  id: string;
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  sections: LearningContentSection[];
  status: "published";
  version: number;
  publishedAt?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  linkedQuizRoute?: string;
  hasPractice: boolean;
}

export interface LearningContentProgress {
  contentId: string;
  contentVersion: number;
  currentSectionId?: string;
  progress: number;
  state: "NOT_STARTED" | "READING" | "COMPLETED" | "PRACTICE_COMPLETED";
  startedAt?: string;
  lastReadAt?: string;
  completedAt?: string;
  practiceCompletedAt?: string;
}

export interface FoundationPracticeQuestion {
  questionId: string;
  sourceType: string;
  sourceKey: string;
  text: string;
  options: string[];
  explanation?: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export interface FoundationPracticeResponse {
  question?: FoundationPracticeQuestion;
}

export interface FoundationPracticeAnswerResponse {
  result: {
    isCorrect: boolean;
    explanation?: string;
    correction?: string;
    nextStep?: string;
    practiceCompletedAt?: string;
  };
  progress: LearningContentProgress;
}

export interface FoundationLearningState {
  status: "needs_diagnostic" | "diagnostic_completed";
  program: "qudrat" | "tahsili";
  baseline: { overall: number; verbal: number; quantitative: number } | null;
  focus: { category: "verbal" | "quantitative"; skill: string; label: string } | null;
  recommendation: { title: string; reason: string; href: string };
  skillSummaries?: Array<{
    key: string;
    label: string;
    category: "verbal" | "quantitative";
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
  }>;
}

export interface FoundationDiagnosticQuestion {
  _id: string;
  text: string;
  options: string[];
  category: "verbal" | "quantitative";
  subcategory: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export interface FoundationDiagnostic {
  attemptId: string;
  expiresAt: string;
  questions: FoundationDiagnosticQuestion[];
}

export interface PlatformReview {
  _id: string;
  studentName: string;
  rating: number;
  text: string;
  adminReply?: string;
  createdAt: string;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...options });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || body?.message || "تعذر تحميل البيانات");
  }
  return body as T;
}

export function useStudentDashboard(enabled = true) {
  return useQuery<StudentDashboard>({
    queryKey: ["/api/student/dashboard"],
    queryFn: async () => {
      const data = await fetchJson<any>("/api/student/dashboard");
      const now = Date.now();
      const endDate = data.subscription?.endDate ? new Date(data.subscription.endDate).getTime() : 0;
      const daysLeft = endDate ? Math.max(0, Math.ceil((endDate - now) / 86400000)) : 0;
      const examDate = data.upcomingExam?.scheduledAt || data.upcomingExam?.targetExamDate || null;
      const levelLabels: Record<string, string> = {
        foundation: "ابدأ بالتأسيس",
        practice: "ركّز على نقاط الضعف",
        mastery: "انتقل للمحاكاة والمراجعة",
      };
      const recentTests = Array.isArray(data.recentTests) ? data.recentTests : [];
      const maxErrors = Math.max(1, ...(data.weaknesses || []).map((item: any) => Number(item.errorCount || 0)));
      return {
        stats: {
          totalTests: Number(data.totals?.tests || 0),
          averageScore: Math.round(Number(data.totals?.averagePercentage || 0)),
          points: Number(data.totals?.correct || 0),
        },
        progress: {
          overall: data.progress?.overall || { percentage: 0, tests: 0, questions: 0 },
          qudrat: data.progress?.qudrat || { percentage: 0, tests: 0, questions: 0 },
          verbal: data.progress?.verbal || { percentage: 0, tests: 0, questions: 0 },
          quantitative: data.progress?.quantitative || { percentage: 0, tests: 0, questions: 0 },
          tahsili: data.progress?.tahsili || { percentage: 0, tests: 0, questions: 0 },
        },
        recentTests: recentTests.map((test: any) => ({
          id: String(test._id),
          title: test.testName || "اختبار تدريبي",
          score: Math.round(Number(test.percentage ?? test.score ?? 0)),
          date: test.completedAt || new Date(0).toISOString(),
          type: test.testType || "qudrat",
        })),
        weaknesses: (data.weaknesses || []).map((item: any) => ({
          subject: "أخطاء متكررة",
          topic: item.name,
          errorRate: Math.round((Number(item.errorCount || 0) / maxErrors) * 100),
        })),
        upcomingExam: { date: examDate },
        recommendedPlan: {
          title: data.recommendedPlan?.focusSubject === "verbal"
            ? "ابدأ بخطة اللفظي"
            : data.recommendedPlan?.focusSubject === "quantitative"
              ? "ابدأ بخطة الكمي"
              : levelLabels[data.recommendedPlan?.level] || "خطتك التالية",
          description: data.recommendedPlan?.focus || "ابدأ بالتأسيس ثم انتقل إلى التدريب المحوسب.",
          nextAction: {
            label: data.recommendedPlan?.level === "mastery" ? "ابدأ اختبارًا محاكيًا" : "افتح خطتك",
            href: data.recommendedPlan?.focusSubject
              ? `/foundation?program=${data.recommendedPlan?.program || "qudrat"}&subject=${data.recommendedPlan.focusSubject}`
              : data.recommendedPlan?.level === "mastery" ? "/book-exam" : "/foundation",
          },
        },
        officialScores: data.officialScores
          ? {
              verbal: data.officialScores.verbal !== undefined ? Number(data.officialScores.verbal) : undefined,
              quantitative: data.officialScores.quantitative !== undefined ? Number(data.officialScores.quantitative) : undefined,
              program: data.officialScores.program === "tahsili" ? "tahsili" : data.officialScores.program === "qudrat" ? "qudrat" : undefined,
              updatedAt: data.officialScores.updatedAt,
            }
          : null,
        subscription: {
          type: data.subscription?.type || (data.subscription?.state === "trial" ? "التجربة المجانية" : "الحساب المجاني"),
          status: data.subscription?.state || "none",
          daysLeft,
        },
        trial: data.subscription?.state === "trial" ? { isActive: true, daysLeft } : null,
        booksCount: Number(data.library?.books || 0),
        foldersCount: Number(data.library?.folders || 0),
      };
    },
    staleTime: 15000,
    refetchOnWindowFocus: true,
    enabled,
  });
}

export function useUpdateOfficialScores() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (scores: {
      verbal?: number;
      quantitative?: number;
      program: "qudrat" | "tahsili";
    }) => fetchJson<{ officialScores: StudentDashboard["officialScores"] }>("/api/student/official-scores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scores),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
      toast({
        title: "تم حفظ النتيجة",
        description: "حدّثنا الخطة لتبدأ من القسم الذي يحتاج دعمًا أكبر.",
      });
    },
  });
}

export function useUpdateExamDate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (date: string | null) => {
      try {
        return await fetchJson<{ targetExamDate: string | null }>("/api/student/exam-date", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetExamDate: date }),
        });
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (_, newDate) => {
      queryClient.setQueryData<StudentDashboard>(["/api/student/dashboard"], (old) => {
        if (!old) return old;
        return { ...old, upcomingExam: { ...old.upcomingExam, date: newDate } };
      });
      toast({
        title: "تم الحفظ",
        description: "تم تحديث موعد الاختبار بنجاح.",
      });
    }
  });
}

export function useFoundationContent(program: 'qudrat' | 'tahsili', enabled = true, subjectId?: string) {
  return useQuery<FoundationContent[]>({
    queryKey: ["/api/foundation-content", program, subjectId || ""],
    queryFn: async () => (await fetchJson<{ content: FoundationContent[] }>(
      `/api/foundation-content?program=${program}${subjectId ? `&subject=${encodeURIComponent(subjectId)}` : ""}`,
    )).content,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLearningContent(contentId: string, enabled = true) {
  return useQuery<LearningContentDocument>({
    queryKey: ["/api/learning/content", contentId],
    queryFn: () => fetchJson<LearningContentDocument>(`/api/learning/content/${encodeURIComponent(contentId)}`),
    enabled: enabled && Boolean(contentId),
    staleTime: 60 * 1000,
  });
}

export function useLearningContentProgress(contentId: string, enabled = true) {
  return useQuery<LearningContentProgress>({
    queryKey: ["/api/learning/content", contentId, "progress"],
    queryFn: () => fetchJson<LearningContentProgress>(`/api/learning/content/${encodeURIComponent(contentId)}/progress`),
    enabled: enabled && Boolean(contentId),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateLearningContentProgress(contentId: string) {
  const queryClient = useQueryClient();
  return useMutation<LearningContentProgress, Error, {
    currentSectionId?: string;
    progress: number;
    state?: LearningContentProgress["state"];
  }>({
    mutationFn: (payload) => fetchJson<LearningContentProgress>(`/api/learning/content/${encodeURIComponent(contentId)}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/learning/content", contentId, "progress"], data);
    },
  });
}

export function useCompleteLearningContent(contentId: string) {
  const queryClient = useQueryClient();
  return useMutation<LearningContentProgress, Error, undefined>({
    mutationFn: () => fetchJson<LearningContentProgress>(`/api/learning/content/${encodeURIComponent(contentId)}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/learning/content", contentId, "progress"], data);
    },
  });
}

export function useFoundationPractice(contentId: string, enabled = true) {
  return useQuery<FoundationPracticeResponse>({
    queryKey: ["/api/learning/content", contentId, "practice"],
    queryFn: () => fetchJson<FoundationPracticeResponse>(`/api/learning/content/${encodeURIComponent(contentId)}/practice`),
    enabled: enabled && Boolean(contentId),
    staleTime: 0,
  });
}

export function useSubmitFoundationPractice(contentId: string) {
  const queryClient = useQueryClient();
  return useMutation<FoundationPracticeAnswerResponse, Error, {
    questionId: string;
    selectedOptionIndex: number;
  }>({
    mutationFn: (payload) => fetchJson<FoundationPracticeAnswerResponse>(`/api/learning/content/${encodeURIComponent(contentId)}/practice/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/learning/content", contentId, "progress"], data.progress);
      queryClient.invalidateQueries({ queryKey: ["/api/learning/content", contentId, "practice"] });
    },
  });
}

export function useFoundationLearningState(program: 'qudrat' | 'tahsili' = 'qudrat', enabled = true) {
  return useQuery<FoundationLearningState>({
    queryKey: ["/api/foundation/learning-state", program],
    queryFn: () => fetchJson<FoundationLearningState>(`/api/foundation/learning-state?program=${program}`),
    enabled,
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });
}

export function useStartFoundationDiagnostic() {
  return useMutation<FoundationDiagnostic, Error, 'qudrat'>({
    mutationFn: (program) => fetchJson<FoundationDiagnostic>(`/api/foundation/diagnostic?program=${program}`),
  });
}

export function useSubmitFoundationDiagnostic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      attemptId: string;
      answers: Array<{ questionId: string; selectedOptionIndex: number }>;
      timeTakenSeconds?: number;
    }) => fetchJson<any>("/api/foundation/diagnostic/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/foundation/learning-state", "qudrat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/dashboard"] });
    },
  });
}

export function usePlatformReviews() {
  return useQuery<PlatformReview[]>({
    queryKey: ["/api/platform-reviews/approved"],
    queryFn: async () => {
      const payload = await fetchJson<{ reviews: Array<PlatformReview & { authorName?: string }> }>("/api/platform-reviews/approved");
      return payload.reviews.map(review => ({ ...review, studentName: review.authorName || "طالب قدراتك" }));
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (review: { rating: number; text: string }) => {
      return fetchJson("/api/platform-reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(review),
        });
    },
    onSuccess: () => {
      toast({
        title: "شكراً لك",
        description: "تم إرسال تقييمك بنجاح وسيتم مراجعته.",
      });
    }
  });
}

export function useUpdateGuardian() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { guardianPhone: string; notifyOnTestCompletion: boolean }) => {
      return fetchJson("/api/user/guardian", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "تم الحفظ",
        description: "تم تحديث بيانات ولي الأمر بنجاح.",
      });
    }
  });
}

export function useChangePassword() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: any) => {
      return fetchJson("/api/user/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم تغيير كلمة المرور بنجاح.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}
