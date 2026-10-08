import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { attachExamTiming, completeExamTiming } from './examTiming';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  if (method.toUpperCase() === 'POST' && (/\/test-results$/.test(url) || /\/submit$/.test(url))) {
    data = attachExamTiming(data);
  }
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  if (method.toUpperCase() === 'POST' && /\/(?:test-results|submit|finish)$/.test(url) && !url.includes('/exam-reports')) {
    const snapshot = completeExamTiming();
    if (snapshot && Object.keys(snapshot.questions).length) {
      // Report failure must never invalidate a successfully saved exam result.
      void fetch('/api/student/exam-reports', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: snapshot.runId, title: snapshot.title,
          questions: Object.values(snapshot.questions).map((q) => ({ ...q, seconds: Math.min(7200, q.seconds) })) }),
      }).then((response) => {
        window.dispatchEvent(new CustomEvent('examReportSaved', { detail: { success: response.ok } }));
      }).catch(() => window.dispatchEvent(new CustomEvent('examReportSaved', { detail: { success: false } })));
    }
  }
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
