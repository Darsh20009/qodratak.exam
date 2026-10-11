import { useMutation } from "@tanstack/react-query";

export interface SupportTicketInput {
  userName: string;
  userPhone: string;
  userEmail: string;
  message: string;
  requestId: string;
  website?: string;
}
export interface SupportTicketResponse {
  success: true;
  ticketId: string;
  reference: string;
  notificationStatus: string;
}
export function useSubmitSupportTicket() {
  return useMutation<SupportTicketResponse, Error, SupportTicketInput>({
    mutationFn: async (input) => {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const response = await fetch(`${base}/api/support-tickets`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success || !data?.ticketId) throw new Error(data?.error || "تعذر إرسال الشكوى. حاول مجددًا.");
      return data;
    },
    retry: false,
  });
}
