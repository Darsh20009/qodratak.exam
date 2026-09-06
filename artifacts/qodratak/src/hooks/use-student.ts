import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Types
export interface StudentDashboard {
  stats: { totalTests: number; averageScore: number; points: number };
  recentTests: Array<{ id: string; title: string; score: number; date: string; type: string }>;
  weaknesses: Array<{ subject: string; topic: string; errorRate: number }>;
  upcomingExam: { date: string | null; targetScore?: number };
  recommendedPlan: { title: string; description: string; nextAction: { label: string; href: string } };
  subscription: { type: string; status: string; daysLeft: number };
  trial: { isActive: boolean; daysLeft: number } | null;
  booksCount: number;
  foldersCount: number;
}

export interface FoundationContent {
  _id: string;
  program: 'qudrat' | 'tahsili';
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  order: number;
  linkedQuizRoute?: string;
  durationMinutes?: number;
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

export function useStudentDashboard() {
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
          title: levelLabels[data.recommendedPlan?.level] || "خطتك التالية",
          description: data.recommendedPlan?.focus || "ابدأ بالتأسيس ثم انتقل إلى التدريب المحوسب.",
          nextAction: {
            label: data.recommendedPlan?.level === "mastery" ? "ابدأ اختبارًا محاكيًا" : "افتح خطتك",
            href: data.recommendedPlan?.level === "mastery" ? "/book-exam" : "/foundation",
          },
        },
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

export function useFoundationContent(program: 'qudrat' | 'tahsili') {
  return useQuery<FoundationContent[]>({
    queryKey: ["/api/foundation-content", program],
    queryFn: async () => (await fetchJson<{ content: FoundationContent[] }>(`/api/foundation-content?program=${program}`)).content,
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
