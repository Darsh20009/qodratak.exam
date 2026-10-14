import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

export type InstitutionType = "school" | "institute" | "university";
export type InstitutionRole = "student" | "teacher" | "institution_admin";
export type ContractStatus = "issued" | "submitted" | "approved" | "rejected";

export interface InstitutionContract {
  reference: string;
  issuedAt: string;
  issuerName: string;
  issuerLegalName: string;
  issuerPlatformName?: string;
  signatureAssetId?: string;
  signatureSha256?: string;
  stampAssetId?: string;
  stampSha256?: string;
  issuerNationalNumber: string;
  policies: string;
  conditions: string[];
  digest: string;
  status: ContractStatus;
  signedSha256?: string;
  signedBytes?: number;
  signedUploadedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  issuedDocumentReady?: boolean;
  portalSentAt?: string;
  portalDeliveryStatus?: string;
}

export interface InstitutionDTO {
  id: string;
  name: string;
  type: InstitutionType;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  maxStudents: number;
  maxTeachers: number;
  isActive: boolean;
  suspended: boolean;
  activatedAt?: string;
  freeEndDate?: string;
  contract: InstitutionContract | null;
  archived?: boolean;
  ownerAccountPhone?: string;
  ownerAccountPending?: boolean;
}

export interface MemberPerformance {
  attempts: number;
  questions: number;
  percentage: number | null;
  confidence: "observed" | "insufficient";
  level: string;
  lastAttemptAt: string | null;
}

export interface RosterMember {
  id: string;
  userId: string;
  role: InstitutionRole;
  status: "active" | "revoked" | string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  joinedAt: string;
  freeStartDate: string;
  freeEndDate: string;
  freeActive: boolean;
  teacherIds: string[];
  subscription?: { type?: string; status?: string; endDate?: string } | null;
  performance: MemberPerformance;
}

export interface InviteDTO {
  id: string;
  role: InstitutionRole;
  hint: string;
  label?: string;
  boundPhone?: string;
  maxUses: number;
  uses: number;
  expiresAt: string;
  revokedAt?: string;
}

export interface InstitutionTestAssignmentDTO {
  id: string;
  title: string;
  examId: number;
  dueAt: string | null;
  status: "active" | "closed";
  createdAt: string;
  submissions: number;
  averagePercentage: number | null;
  completed?: boolean;
  expired?: boolean;
  percentage?: number | null;
  completedAt?: string | null;
}
export interface InstitutionTestSubmissionDTO {
  userId: string;
  fullName: string;
  completed: boolean;
  percentage?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  skippedQuestions?: number;
  totalQuestions?: number;
  timeTaken?: number;
  completedAt?: string;
  testName?: string;
}

export interface Membership {
  institutionId: string;
  institutionName: string;
  role: InstitutionRole;
  status: string;
  joinedAt: string;
  freeStartDate: string;
  freeEndDate: string;
  institutionActive: boolean;
  freeActive: boolean;
  teacherIds: string[];
}

export interface PendingInstitution { name: string; status: string; contractLink?: string | null; documentReady?: boolean }

export interface InvitePreview {
  institutionName: string;
  role: InstitutionRole;
  freeMonths: number;
  individualStart: boolean;
  requiresBoundPhone: boolean;
}

export interface StoredResult {
  _id: string;
  testName?: string;
  testType?: string;
  program?: string;
  percentage?: number;
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  skippedQuestions?: number;
  completedAt?: string;
  timeTaken?: number;
  weakAreas?: string[];
  strongAreas?: string[];
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public body?: any) { super(message); }
}

export async function instFetch<T = any>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init || {};
  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers || {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  let body: any = null;
  const text = await res.text();
  if (text) { try { body = JSON.parse(text); } catch { body = { message: text }; } }
  if (!res.ok) throw new ApiError(body?.message || body?.error || "تعذر إكمال الطلب", res.status, body);
  return body as T;
}

export const ROLE_LABEL: Record<InstitutionRole, string> = {
  student: "طالب",
  teacher: "معلم",
  institution_admin: "مدير المؤسسة",
};
export const TYPE_LABEL: Record<InstitutionType, string> = {
  school: "مدرسة",
  institute: "معهد",
  university: "جامعة",
};
export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  issued: "صادر بانتظار التوقيع",
  submitted: "نسخة موقعة بانتظار المراجعة",
  approved: "معتمد",
  rejected: "النسخة الموقعة مرفوضة",
};

export function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-SA", { calendar: "gregory", timeZone: "Asia/Riyadh", year: "numeric", month: "long", day: "numeric" });
}
export function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-SA", { calendar: "gregory", timeZone: "Asia/Riyadh", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function daysLeft(value?: string | null) {
  if (!value) return null;
  const ms = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

/** Refresh server-authoritative identity after a role-changing action. */
export async function refreshIdentity(qc: QueryClient) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ["/api/user"] }),
    qc.invalidateQueries({ queryKey: ["/api/subscription/status"] }),
    qc.invalidateQueries({ queryKey: ["institution"] }),
    qc.invalidateQueries({ queryKey: ["/api/student/dashboard"] }),
  ]);
}

/* ─────────── Admin ─────────── */

export const adminKeys = {
  list: ["admin-institutions"] as const,
  detail: (id: string) => ["admin-institutions", id] as const,
  invites: (id: string) => ["admin-institutions", id, "invites"] as const,
};

export function useAdminInstitutions(enabled = true) {
  return useQuery({
    queryKey: adminKeys.list,
    queryFn: () => instFetch<{ institutions: InstitutionDTO[]; storageReady: boolean }>("/api/admin/institutions"),
    enabled,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}
export function useAdminInstitution(id: string | null) {
  return useQuery({
    queryKey: adminKeys.detail(id || ""),
    queryFn: () => instFetch<{ institution: InstitutionDTO; members: RosterMember[] }>(`/api/admin/institutions/${id}`),
    enabled: !!id,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });
}
export function useAdminInvites(id: string | null, enabled = true) {
  return useQuery({
    queryKey: adminKeys.invites(id || ""),
    queryFn: () => instFetch<{ invites: InviteDTO[] }>(`/api/admin/institutions/${id}/invites`),
    enabled: !!id && enabled,
  });
}

function useAdminRefresh() {
  const qc = useQueryClient();
  return (id?: string, institution?: InstitutionDTO) => {
    if (id && institution) {
      qc.setQueryData(adminKeys.detail(id), (old: any) => old ? { ...old, institution } : old);
    }
    qc.invalidateQueries({ queryKey: adminKeys.list });
    if (id) qc.invalidateQueries({ queryKey: adminKeys.detail(id) });
  };
}

export interface CreateInstitutionBody {
  name: string; type: InstitutionType; email: string; phone?: string; city?: string; address?: string;
  maxStudents: number; maxTeachers: number; issuerName: string; issuerAuthorized: true; policies: string; ownerName?: string;
}

export interface DeliveryNotice { status: string; message?: string }
export interface CreateInstitutionResult {
  institution: InstitutionDTO;
  ownerAccount?: { status: string; phone?: string; message?: string };
  contractLink?: string;
  notification?: DeliveryNotice;
}
export interface UpdateInstitutionBody {
  name?: string; email?: string; phone?: string; city?: string; address?: string;
  maxStudents?: number; maxTeachers?: number; ownerName?: string; issuerAuthorized?: true;
}

export function useCreateInstitution() {
  const refresh = useAdminRefresh();
  return useMutation({
    mutationFn: (body: CreateInstitutionBody) =>
      instFetch<CreateInstitutionResult>("/api/admin/institutions", { method: "POST", json: body }),
    onSuccess: (r) => refresh(r.institution.id, r.institution),
  });
}
export function useUpdateInstitution(id: string) {
  const refresh = useAdminRefresh();
  return useMutation({
    mutationFn: (body: UpdateInstitutionBody) =>
      instFetch<{ institution: InstitutionDTO }>(`/api/admin/institutions/${id}`, { method: "PATCH", json: body }),
    onSuccess: (r) => refresh(id, r?.institution),
  });
}
export function useArchiveInstitution(id: string) {
  const refresh = useAdminRefresh();
  return useMutation({
    mutationFn: () => instFetch<{ institution?: InstitutionDTO }>(`/api/admin/institutions/${id}`, { method: "DELETE" }),
    onSuccess: () => refresh(id),
  });
}
/** Upload the platform-issued contract PDF (auth header injected by the admin fetch bridge). */
export function uploadIssuedContract(id: string, file: Blob, reference: string) {
  const fd = new FormData();
  fd.append("reference", reference);
  fd.append("file", file instanceof File ? file : new File([file], `${reference}.pdf`, { type: "application/pdf" }));
  return instFetch<{ institution?: InstitutionDTO }>(`/api/admin/institutions/${id}/issued-contract`, { method: "POST", body: fd });
}
export function sendContractLink(id: string) {
  return instFetch<{ url: string; notification: DeliveryNotice }>(`/api/admin/institutions/${id}/send-contract`, { method: "POST", json: {} });
}
/** True only when the backend explicitly reports the message as delivered/sent. */
export function deliveryConfirmed(n?: DeliveryNotice | null) {
  return !!n && ["sent", "delivered", "queued_confirmed"].includes(String(n.status));
}

/* ─────────── Public contract portal (token from URL fragment, Bearer auth) ─────────── */
export interface ContractPortalInfo {
  institution: InstitutionDTO; documentReady: boolean; canUpload: boolean; submitted: boolean; reference: string; ownerAccountPending?: boolean;
}
export function portalLookup(token: string) {
  return instFetch<ContractPortalInfo>("/api/institutions/contract-portal", { method: "POST", json: { token } });
}
export async function portalDownloadPdf(token: string, reference: string) {
  const res = await fetch("/api/institutions/contract-portal/pdf", { headers: { Authorization: `Bearer ${token}` }, credentials: "omit" });
  if (!res.ok) {
    let msg = "تعذر تنزيل نسخة العقد";
    try { msg = (await res.json()).message || msg; } catch { /* ignore */ }
    throw new ApiError(msg, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${reference}.pdf`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function portalUploadSigned(token: string, file: File, reference: string, signerName: string) {
  const fd = new FormData();
  fd.append("file", file); fd.append("reference", reference); fd.append("signerName", signerName); fd.append("consent", "true");
  return instFetch<{ submitted: boolean; message?: string }>("/api/institutions/contract-portal/upload", {
    method: "POST", body: fd, credentials: "omit", headers: { Authorization: `Bearer ${token}` },
  });
}

export function useUploadSigned(id: string) {
  const refresh = useAdminRefresh();
  return useMutation({
    mutationFn: ({ file, reference }: { file: File; reference: string }) => {
      const fd = new FormData();
      fd.append("reference", reference);
      fd.append("file", file);
      return instFetch<{ institution: InstitutionDTO }>(`/api/admin/institutions/${id}/signed-contract`, { method: "POST", body: fd });
    },
    onSuccess: (r) => refresh(id, r.institution),
  });
}
export function useApproveContract(id: string) {
  const refresh = useAdminRefresh();
  return useMutation({
    mutationFn: (signedSha256: string) =>
      instFetch<{ institution: InstitutionDTO }>(`/api/admin/institutions/${id}/approve`, { method: "POST", json: { reviewedSignedContract: true, signedSha256 } }),
    onSuccess: (r) => refresh(id, r.institution),
  });
}
export function useRejectContract(id: string) {
  const refresh = useAdminRefresh();
  return useMutation({
    mutationFn: (reason: string) =>
      instFetch<{ institution: InstitutionDTO }>(`/api/admin/institutions/${id}/reject`, { method: "POST", json: { reason } }),
    onSuccess: (r) => refresh(id, r.institution),
  });
}
export function useSetAvailability(id: string) {
  const refresh = useAdminRefresh();
  return useMutation({
    mutationFn: (active: boolean) =>
      instFetch<{ institution: InstitutionDTO }>(`/api/admin/institutions/${id}/availability`, { method: "POST", json: { active } }),
    onSuccess: (r) => refresh(id, r.institution),
  });
}

export interface IssueInviteBody { role: InstitutionRole; boundPhone?: string; maxUses?: number; validDays?: number; label?: string }

export function useAdminIssueInvite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: IssueInviteBody) =>
      instFetch<{ code: string; invite: InviteDTO }>(`/api/admin/institutions/${id}/invites`, { method: "POST", json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.invites(id) }),
  });
}
export function useAdminRevokeInvite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      instFetch(`/api/admin/institutions/${id}/invites/${inviteId}/revoke`, { method: "POST", json: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.invites(id) }),
  });
}

export async function downloadSignedContract(id: string, reference: string) {
  const res = await fetch(`/api/admin/institutions/${id}/signed-contract`, { credentials: "include" });
  if (!res.ok) {
    let msg = "تعذر تنزيل النسخة الموقعة";
    try { msg = (await res.json()).message || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${reference}-signed.pdf`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ─────────── Member side ─────────── */

export function useMembership(enabled = true) {
  return useQuery({
    queryKey: ["institution", "membership"],
    queryFn: () => instFetch<{ membership: Membership | null; pendingInstitution?: PendingInstitution | null }>("/api/institution/membership"),
    enabled,
    retry: (n, e: any) => e?.status !== 401 && n < 1,
  });
}
export function useInstitutionDashboard(enabled = true) {
  return useQuery({
    queryKey: ["institution", "dashboard"],
    queryFn: () => instFetch<{ institution: InstitutionDTO; members: RosterMember[]; role: InstitutionRole; membership: Membership }>("/api/institution/dashboard"),
    enabled,
    retry: (n, e: any) => ![401, 403].includes(e?.status) && n < 1,
  });
}
export function useInstitutionInvites(enabled = true) {
  return useQuery({
    queryKey: ["institution", "invites"],
    queryFn: () => instFetch<{ invites: InviteDTO[] }>("/api/institution/invites"),
    enabled,
  });
}
export function useInstitutionAssignments(enabled = true) {
  return useQuery({
    queryKey: ["institution", "assignments"],
    queryFn: () => instFetch<{ assignments: InstitutionTestAssignmentDTO[] }>("/api/institution/assignments"),
    enabled,
    retry: (n, e: any) => ![401, 403].includes(e?.status) && n < 1,
  });
}
export function useCreateInstitutionAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; examId: number; dueAt: string | null }) =>
      instFetch<{ assignment: InstitutionTestAssignmentDTO }>("/api/institution/assignments", { method: "POST", json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institution", "assignments"] }),
  });
}
export function useCloseInstitutionAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      instFetch(`/api/institution/assignments/${id}/close`, { method: "POST", json: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institution", "assignments"] }),
  });
}
export function useInstitutionAssignmentResults(id: string, enabled = true) {
  return useQuery({
    queryKey: ["institution", "assignment-results", id],
    queryFn: () => instFetch<{ assignment: InstitutionTestAssignmentDTO; results: InstitutionTestSubmissionDTO[] }>(`/api/institution/assignments/${id}/results`),
    enabled: enabled && Boolean(id),
    retry: (n, e: any) => ![401, 403, 404].includes(e?.status) && n < 1,
  });
}
export function useStudentInstitutionAssignments(enabled = true) {
  return useQuery({
    queryKey: ["institution", "student-assignments"],
    queryFn: () => instFetch<{ institutionName: string; assignments: InstitutionTestAssignmentDTO[] }>("/api/institution/student/assignments"),
    enabled,
    staleTime: 30_000,
    retry: (n, e: any) => ![401, 403].includes(e?.status) && n < 1,
  });
}
export function useIssueInstitutionInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: IssueInviteBody) =>
      instFetch<{ code: string; invite: InviteDTO }>("/api/institution/invites", { method: "POST", json: body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institution", "invites"] }),
  });
}
export function useRevokeInstitutionInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => instFetch(`/api/institution/invites/${inviteId}/revoke`, { method: "POST", json: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institution", "invites"] }),
  });
}
export function useAssignTeachers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, teacherIds }: { memberId: string; teacherIds: string[] }) =>
      instFetch(`/api/institution/members/${memberId}/teachers`, { method: "POST", json: { teacherIds } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institution", "dashboard"] }),
  });
}
export function useRevokeMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => instFetch(`/api/institution/members/${memberId}/revoke`, { method: "POST", json: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institution", "dashboard"] }),
  });
}
export function useStudentResults(userId: string | null) {
  return useQuery({
    queryKey: ["institution", "results", userId],
    queryFn: () => instFetch<{ results: StoredResult[] }>(`/api/institution/students/${userId}/results`),
    enabled: !!userId,
    retry: false,
  });
}
export function previewInvite(code: string) {
  return instFetch<InvitePreview>("/api/institutions/preview", { method: "POST", json: { code: code.trim() } });
}
export function useJoinInstitution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, phoneVerificationToken }: { code: string; phoneVerificationToken?: string }) =>
      instFetch<{ membership: Membership; user: any }>("/api/institutions/join", {
        method: "POST",
        json: { code: code.trim(), consent: true, ...(phoneVerificationToken ? { phoneVerificationToken } : {}) },
      }),
    onSuccess: async (r) => {
      qc.setQueryData(["/api/user"], r.user);
      await refreshIdentity(qc);
    },
  });
}

export function roleHome(role?: string) {
  if (role === "institution_admin") return "/institution";
  if (role === "teacher") return "/teacher";
  return "/";
}

// Accept legacy 36-character invite codes as well as the shorter 16-character format.
export const INVITE_CODE_RE = /^(?:[A-Fa-f0-9]{16}|[A-Fa-f0-9]{36})$/;

/** Same OTP service as AuthModal (purpose "signup"), used to prove control of the account phone for staff joins. */
export async function requestJoinOtp(phone: string, deviceId: string) {
  return instFetch<{ retryAfter?: number }>("/api/auth/phone-otp/request", { method: "POST", json: { phone, purpose: "signup", deviceId } });
}
export async function verifyJoinOtp(phone: string, otp: string, deviceId: string) {
  const r = await instFetch<{ verificationToken?: string }>("/api/auth/phone-otp/verify", { method: "POST", json: { phone, otp, purpose: "signup", deviceId } });
  if (!r?.verificationToken) throw new ApiError("تعذر تأكيد رقم الجوال", 400, r);
  return r.verificationToken;
}
