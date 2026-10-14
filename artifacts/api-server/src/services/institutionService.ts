import mongoose, { type ClientSession } from "mongoose";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Institution, User, TestResult } from "../mongodb/models";
import { InstitutionInvite, InstitutionMember } from "../mongodb/institutionModels";
import { institutionIssuerName, institutionIssuerPlatform, institutionIssuerAssets } from "./institutionIssuer";

export class InstitutionError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const INSTITUTION_ROLES = ["student", "teacher", "institution_admin"] as const;
export function threeMonthsAfter(start: Date) {
  const riyadhOffset = 3 * 60 * 60 * 1000;
  const end = new Date(start.getTime() + riyadhOffset);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 3);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return new Date(end.getTime() - riyadhOffset);
}
export function normalizeInstitutionPhone(value: unknown) {
  let phone = String(value || "").replace(/\D/g, "");
  if (/^05\d{8}$/.test(phone)) phone = `966${phone.slice(1)}`;
  if (/^5\d{8}$/.test(phone)) phone = `966${phone}`;
  if (!/^9665\d{8}$/.test(phone)) throw new InstitutionError("أدخل رقم جوال سعودي صالحًا");
  return phone;
}
const codeHash = (value: string) => createHash("sha256").update(value.trim().toUpperCase()).digest("hex");
const text = (value: unknown, max: number) => String(value || "").trim().slice(0, max);
const institutionConditions = [
  "يحصل كل طالب على ثلاثة أشهر ميلادية مجانية من تاريخ انضمامه هو، حتى لو انضم لاحقًا؛ وتُحسب التواريخ وفق توقيت الرياض.",
  "تبدأ الأشهر الثلاثة المجانية للمؤسسة ومديرها ومعلميها من تاريخ اعتماد العقد وتفعيل المؤسسة.",
  "تقتصر المزايا على المحتوى والخدمات المنشورة والمتاحة فعليًا. الأقسام الموسومة «قريبًا»، ومنها التحصيلي، غير مشمولة ولا يُعد العقد التزامًا بموعد إتاحتها.",
  "لا تُفعّل المؤسسة إلا بعد رفع نسخة العقد الموقعة من طرفها ومراجعتها واعتمادها بشكل منفصل من إدارة قدراتك.",
  "لا يعاد بدء الفترة المجانية بتكرار كود الانضمام أو تغيير المؤسسة؛ ولا تمس المدة المؤسسية اشتراكًا مدفوعًا قائمًا أو مدته أو حقوقه.",
  "أكواد المعلمين والمديرين شخصية، مرتبطة بجوال محدد، صالحة لمرة واحدة، وتتطلب إثبات ملكية الجوال. كود المدير يصدر من إدارة قدراتك فقط ولا يمنح إدارة المنصة.",
  "يتطلب الانضمام موافقة صريحة على مشاركة بيانات التعلم مع المؤسسة. يرى مدير المؤسسة أعضاء مؤسسته فقط، والمعلم الطلاب المسندين إليه فقط.",
  "مؤشرات الأداء مبنية على الاختبارات المرصودة، وليست ضمانًا لإتقان جميع المهارات أو لدرجة في الاختبار الرسمي.",
  "إلغاء العضوية ينهي الوصول إلى تقارير التعلم الجديدة، دون حذف سجلات الطالب؛ ويحتفظ النظام بالحد الأدنى من معلومات العضوية للتوثيق.",
  "تستخدم المؤسسة البيانات للأغراض التعليمية فقط وبما يتفق مع سياسات المنصة ونظام حماية البيانات الشخصية السعودي.",
  "اعتماد قدراتك إلكتروني داخلي باسم المفوض وحساب الإدارة وتاريخه، وليس شهادة توقيع إلكتروني مؤهلة.",
  "لا يتسبب انتهاء الفترة المجانية في خصم أو تجديد مالي تلقائي؛ تطبق شروط الاشتراك والخدمات المعتمدة بعد انتهائها.",
];
export function activeInstitution(institution: any) {
  return Boolean(institution?.isActive && !institution.archivedAt && !institution.suspendedAt &&
    institution.contract?.status === "approved" && institution.contract.signedObjectKey);
}
export function canRestoreActiveInstitutionOwner(user: any, institution: any) {
  const id = (value: any) => value == null ? "" : String(value?._id ?? value);
  return user?.role === "institution_admin" &&
    id(user._id) !== "" &&
    id(user._id) === id(institution?.adminUserId) &&
    id(user.institutionId) === id(institution?._id) &&
    activeInstitution(institution);
}

export function canStudentSubmitInstitutionTest(input: {
  userRole: unknown;
  memberRole: unknown;
  memberStatus: unknown;
  memberInstitutionId: unknown;
  institutionId: unknown;
  institutionIsActive: boolean;
  assignmentStatus: unknown;
  dueAt?: Date | string | null;
  assignedExamId: number;
  submittedExamId: number;
  alreadyCompleted: boolean;
  now?: Date;
}): { allowed: true } | { allowed: false; status: 403 | 409 | 410; message: string } {
  if (input.userRole !== "student" || input.memberRole !== "student" ||
      input.memberStatus !== "active" || String(input.memberInstitutionId) !== String(input.institutionId)) {
    return { allowed: false, status: 403, message: "هذا الاختبار مخصص لطلاب المؤسسة المسجلين فقط." };
  }
  if (!input.institutionIsActive || input.assignmentStatus !== "active") {
    return { allowed: false, status: 403, message: "انتهى إتاحة اختبار المؤسسة أو لم يعد حسابك ضمن طلابها النشطين." };
  }
  if (input.dueAt && new Date(input.dueAt).getTime() <= (input.now ?? new Date()).getTime()) {
    return { allowed: false, status: 410, message: "انتهى موعد هذا الاختبار." };
  }
  if (input.submittedExamId !== input.assignedExamId) {
    return { allowed: false, status: 403, message: "هذا الاختبار لا يطابق التكليف الصادر من المؤسسة." };
  }
  if (input.alreadyCompleted) {
    return { allowed: false, status: 409, message: "سبق أن أتممت اختبار المؤسسة؛ راجع نتيجتك في صفحة نتائجي." };
  }
  return { allowed: true };
}
export function institutionCreationData(input: any, actorId: string) {
  const name = text(input.name, 180);
  const email = text(input.email, 180).toLowerCase();
  const issuerName = institutionIssuerName;
  const policies = typeof input.policies === "string" ? input.policies.trim() : "";
  if (name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !["school", "institute", "university"].includes(input.type)) throw new InstitutionError("أكمل بيانات المؤسسة بشكل صحيح");
  if (issuerName.length < 4 || input.issuerAuthorized !== true) throw new InstitutionError("يجب تحديد اسم المفوّض والإقرار بصلاحية اعتماد العقد");
  if (policies.length < 100 || policies.length > 120000) throw new InstitutionError("يجب إدراج السياسات الكاملة في العقد ضمن الحد المسموح");
  const maxStudents = Number(input.maxStudents ?? 100);
  const maxTeachers = Number(input.maxTeachers ?? 10);
  if (![maxStudents, maxTeachers].every(v => Number.isInteger(v) && v >= 1 && v <= 10000)) throw new InstitutionError("حدود الأعضاء يجب أن تكون بين ١ و١٠٠٠٠");
  const issuedAt = new Date();
  const contract = {
    reference: `QDR-INS-${randomUUID()}`, issuedAt, issuerName, issuedBy: actorId,
    issuerLegalName: "مؤسسة قدراتك العالية", issuerNationalNumber: "7055077809",
    issuerPlatformName: institutionIssuerPlatform, ...institutionIssuerAssets,
    policies, conditions: institutionConditions, status: "issued",
    digest: createHash("sha256").update(JSON.stringify({
      name, email, type: input.type, maxStudents, maxTeachers, policies,
      conditions: institutionConditions, issuerName, issuedAt,
      issuerPlatformName: institutionIssuerPlatform, ...institutionIssuerAssets,
    })).digest("hex"),
  };
  return {
    name, email, type: input.type, phone: text(input.phone, 30), ownerName: text(input.ownerName, 180),
    address: text(input.address, 300), city: text(input.city, 80),
    maxStudents, maxTeachers, isActive: false, contract,
  };
}
export async function createInstitution(input: any, actorId: string) {
  return Institution.create(institutionCreationData(input, actorId));
}
export async function findInstitution(id: string, session?: ClientSession) {
  if (!mongoose.isValidObjectId(id)) throw new InstitutionError("المؤسسة غير موجودة", 404);
  const institution = await Institution.findById(id).session(session || null);
  if (!institution) throw new InstitutionError("المؤسسة غير موجودة", 404);
  return institution;
}
export function institutionDto(institution: any) {
  const c = institution.contract;
  return {
    id: String(institution._id), name: institution.name, type: institution.type,
    email: institution.email, phone: institution.phone, city: institution.city, address: institution.address,
    maxStudents: institution.maxStudents, maxTeachers: institution.maxTeachers,
    isActive: activeInstitution(institution), suspended: Boolean(institution.suspendedAt),
    archived: Boolean(institution.archivedAt), ownerName: institution.ownerName,
    ownerAccountPhone: institution.ownerAccountPhone,
    ownerAccountPending: Boolean(institution.adminUserId && !activeInstitution(institution)),
    activatedAt: institution.activatedAt, freeEndDate: institution.subscriptionEndDate,
    contract: c ? {
      reference: c.reference, issuedAt: c.issuedAt, issuerName: c.issuerName,
      issuerLegalName: c.issuerLegalName, issuerNationalNumber: c.issuerNationalNumber,
      issuerPlatformName: c.issuerPlatformName,
      signatureAssetId: c.signatureAssetId, signatureSha256: c.signatureSha256,
      stampAssetId: c.stampAssetId, stampSha256: c.stampSha256,
      policies: c.policies, conditions: c.conditions, digest: c.digest, status: c.status,
      signedSha256: c.signedSha256, signedBytes: c.signedBytes,
      signedUploadedAt: c.signedUploadedAt, approvedAt: c.approvedAt,
      rejectionReason: c.rejectionReason,
      issuedDocumentReady: Boolean(c.issuedObjectKey),
      portalSentAt: c.portalSentAt, portalDeliveryStatus: c.portalDeliveryStatus,
    } : null,
  };
}
export async function issueInvite(institutionId: string, input: any, actorId: string, platformAdmin: boolean) {
  const institution = await findInstitution(institutionId);
  if (!activeInstitution(institution)) throw new InstitutionError("لا يمكن إصدار أكواد قبل اعتماد العقد وتفعيل المؤسسة", 409);
  if (!INSTITUTION_ROLES.includes(input.role)) throw new InstitutionError("الدور غير صالح");
  if (!platformAdmin && input.role === "institution_admin") throw new InstitutionError("كود مدير المؤسسة يصدر من إدارة قدراتك فقط", 403);
  const staff = input.role !== "student";
  const boundPhone = staff ? normalizeInstitutionPhone(input.boundPhone) : undefined;
  const maxUses = staff ? 1 : Number(input.maxUses ?? institution.maxStudents);
  const validDays = Number(input.validDays ?? 30);
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > institution.maxStudents ||
      !Number.isInteger(validDays) || validDays < 1 || validDays > 90) throw new InstitutionError("أدخل حدود استخدام ومدة صلاحية صحيحة");
  const code = randomBytes(18).toString("hex").toUpperCase();
  const invite = await InstitutionInvite.create({
    institutionId, role: input.role, boundPhone, maxUses,
    expiresAt: new Date(Date.now() + validDays * 86400000),
    codeHash: codeHash(code), hint: `${code.slice(0, 4)}…${code.slice(-4)}`,
    label: text(input.label, 100), createdBy: actorId,
  });
  return { code, invite: inviteDto(invite) };
}
export function inviteDto(invite: any) {
  return {
    id: String(invite._id), role: invite.role, hint: invite.hint, label: invite.label,
    boundPhone: invite.boundPhone, maxUses: invite.maxUses, uses: invite.uses,
    expiresAt: invite.expiresAt, revokedAt: invite.revokedAt,
  };
}
export async function validateInvite(code: unknown, phone?: unknown, session?: ClientSession) {
  if (typeof code !== "string" || !/^[A-Fa-f0-9]{36}$/.test(code.trim())) throw new InstitutionError("كود الانضمام غير صالح");
  const invite = await InstitutionInvite.findOne({
    codeHash: codeHash(code), revokedAt: { $exists: false }, expiresAt: { $gt: new Date() },
    $expr: { $lt: ["$uses", "$maxUses"] },
  }).session(session || null);
  if (!invite) throw new InstitutionError("الكود منتهي أو مستخدم أو ملغى", 409);
  const institution = await findInstitution(String(invite.institutionId), session);
  if (!activeInstitution(institution)) throw new InstitutionError("المؤسسة لم تُفعّل أو تم إيقافها", 403);
  if (phone !== undefined && invite.boundPhone && invite.boundPhone !== normalizeInstitutionPhone(phone)) throw new InstitutionError("هذا الكود مخصص لرقم جوال آخر", 403);
  return { invite, institution };
}
export async function joinInstitution(userId: string, code: string, existingSession?: ClientSession) {
  const work = async (session: ClientSession) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new InstitutionError("الحساب غير موجود", 404);
    const { institution, invite } = await validateInvite(code, user.phone || "", session);
    const existing = await InstitutionMember.findOne({ userId }).session(session);
    if (existing) throw new InstitutionError("هذا الحساب سبق ضمه لمؤسسة؛ لا يمكن إعادة بدء الفترة المجانية", 409);
    if (user.institutionId && String(user.institutionId) !== String(institution._id)) throw new InstitutionError("الحساب مرتبط بمؤسسة أخرى", 409);
    if (!["student", "teacher", "institution_admin"].includes(user.role)) throw new InstitutionError("لا يمكن تحويل حساب إدارة المنصة إلى عضو مؤسسة", 403);
    // Serialize quota reservations and suspension/activation against this join.
    const reserved = await Institution.updateOne({
      _id: institution._id, isActive: true, "contract.status": "approved", suspendedAt: { $exists: false },
    }, { $inc: { memberRevision: 1 } }, { session });
    if (!reserved.modifiedCount) throw new InstitutionError("المؤسسة غير متاحة", 409);
    const count = await InstitutionMember.countDocuments({
      institutionId: institution._id, role: invite.role, status: "active",
    }).session(session);
    const limit = invite.role === "student" ? institution.maxStudents : invite.role === "teacher" ? institution.maxTeachers : 1;
    if (count >= limit) throw new InstitutionError("وصلت المؤسسة إلى حد الأعضاء لهذا الدور", 409);
    const claimed = await InstitutionInvite.updateOne({
      _id: invite._id, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() },
      $expr: { $lt: ["$uses", "$maxUses"] },
    }, { $inc: { uses: 1 } }, { session });
    if (!claimed.modifiedCount) throw new InstitutionError("سبق استخدام الكود", 409);
    const now = new Date();
    const freeStartDate = invite.role === "student" ? now : institution.activatedAt || now;
    const freeEndDate = invite.role === "student" ? threeMonthsAfter(now) : institution.subscriptionEndDate || threeMonthsAfter(now);
    await InstitutionMember.create([{
      institutionId: institution._id, userId, role: invite.role, joinedAt: now,
      nameAtJoin: user.fullName,
      freeStartDate, freeEndDate, teacherIds: [],
    }], { session });
    user.role = invite.role;
    user.institutionId = institution._id as mongoose.Types.ObjectId;
    user.trialUsed = true;
    user.trialStartDate = freeStartDate;
    user.trialEndDate = freeEndDate;
    // Keep paid subscriptions untouched. Extended trial is separately audited by membership.
    if (!["Pro", "Pro Life", "Pro Life Plus", "Pro Live"].includes(String(user.subscription?.type))) {
      user.subscription = {
        type: "free_trial", status: "active",
        startDate: freeStartDate.toISOString(), endDate: freeEndDate.toISOString(),
        trialDays: Math.ceil((freeEndDate.getTime() - freeStartDate.getTime()) / 86400000),
      } as any;
    }
    await user.save({ session });
    if (invite.role === "institution_admin") await Institution.updateOne({ _id: institution._id }, { $set: { adminUserId: user._id } }, { session });
    return { institutionId: String(institution._id), institutionName: institution.name, role: invite.role, freeStartDate, freeEndDate };
  };
  if (existingSession) return work(existingSession);
  const session = await mongoose.startSession();
  try { return await session.withTransaction(() => work(session)); }
  finally { await session.endSession(); }
}
export async function membershipForUser(userId: unknown, now = new Date()) {
  if (!mongoose.isValidObjectId(userId)) return null;
  const member = await InstitutionMember.findOne({ userId }).lean() as any;
  if (!member) return null;
  const institution = await Institution.findById(member.institutionId).lean();
  const active = member.status === "active" && activeInstitution(institution);
  return {
    institutionId: String(member.institutionId), institutionName: institution?.name || "",
    role: member.role, status: member.status, joinedAt: member.joinedAt,
    freeStartDate: member.freeStartDate, freeEndDate: member.freeEndDate,
    institutionActive: active, freeActive: active && member.freeEndDate > now,
    teacherIds: (member.teacherIds || []).map(String),
  };
}
export async function institutionalRoster(institutionId: string, teacherId?: string) {
  const members = await InstitutionMember.find({
    institutionId, ...(teacherId ? { role: "student", teacherIds: teacherId, status: "active" } : {}),
  }).sort({ joinedAt: -1 }).lean() as any[];
  const ids = members.map(m => String(m.userId));
  const users = await User.find({ _id: { $in: ids } }).select("fullName username email phone subscription level").lean();
  const userMap = new Map(users.map(u => [String(u._id), u]));
  const currentStudentIds = members.filter(m => m.role === "student" && m.status === "active").map(m => String(m.userId));
  const summaries = await TestResult.aggregate([
    { $match: { userId: { $in: currentStudentIds }, totalQuestions: { $gt: 0 },
      correctAnswers: { $gte: 0 }, $expr: { $lte: ["$correctAnswers", "$totalQuestions"] },
      program: { $ne: "tahsili" } } },
    { $group: { _id: "$userId", attempts: { $sum: 1 }, questions: { $sum: "$totalQuestions" },
      correct: { $sum: "$correctAnswers" }, lastAttemptAt: { $max: "$completedAt" } } },
  ]);
  const summaryMap = new Map(summaries.map(s => [String(s._id), s]));
  return members.filter(m => userMap.has(String(m.userId))).map(m => {
    const u: any = m.status === "active" ? userMap.get(String(m.userId)) :
      { fullName: m.nameAtJoin || "عضو سابق", username: "", subscription: null };
    const s: any = summaryMap.get(String(m.userId));
    const percentage = s?.questions ? Math.round(100 * s.correct / s.questions) : null;
    const sufficient = (s?.attempts || 0) >= 3 && (s?.questions || 0) >= 30;
    return {
      id: String(m._id), userId: String(m.userId), role: m.role, status: m.status,
      fullName: u.fullName, username: u.username, email: u.email, phone: u.phone,
      joinedAt: m.joinedAt, freeStartDate: m.freeStartDate, freeEndDate: m.freeEndDate,
      freeActive: m.status === "active" && m.freeEndDate > new Date(),
      teacherIds: (m.teacherIds || []).map(String), subscription: u.subscription,
      performance: { attempts: s?.attempts || 0, questions: s?.questions || 0, percentage,
        confidence: sufficient ? "observed" : "insufficient",
        level: !sufficient ? "بيانات غير كافية" : percentage! >= 85 ? "أداء متقدم مرصود" : percentage! >= 60 ? "أداء متوسط مرصود" : "يحتاج إلى دعم",
        lastAttemptAt: s?.lastAttemptAt || null },
    };
  });
}
