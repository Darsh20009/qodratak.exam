import type { Express, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import multer from "multer";
import { Admin, Institution, User, TestResult } from "../mongodb/models";
import { InstitutionInvite, InstitutionMember, InstitutionTestAssignment } from "../mongodb/institutionModels";
import {
  InstitutionError, createInstitution, findInstitution, institutionDto, activeInstitution,
  issueInvite, inviteDto, validateInvite, joinInstitution, membershipForUser, canRestoreActiveInstitutionOwner,
  normalizeInstitutionPhone, institutionalRoster, threeMonthsAfter,
} from "../services/institutionService";
import {
  contractStorageReady, storeSignedContract, loadSignedContract,
  validateSignedPdf,
} from "../services/institutionContractStorage";
import { getInstitutionIssuerAsset } from "../services/institutionIssuer";
import { registerInstitutionLifecycleRoutes } from "./institutionLifecycleRoutes";
import { activateInstitutionOwner, notifyInstitutionActivation, pendingInstitutionFor, setupInstitutionOwner } from "../services/institutionLifecycle";

type Dependencies = {
  requireAdmin: RequestHandler;
  verifyPhoneVerificationToken: (token: any, phone: any, purpose: any) => boolean;
};
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 1 } });
const invitationWindows = new Map<string, { count: number; until: number }>();
const invitationLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  const key = `${req.path}:${req.ip}`;
  let window = invitationWindows.get(key);
  if (!window || window.until <= now) {
    for (const [id, entry] of invitationWindows) if (entry.until <= now) invitationWindows.delete(id);
    if (invitationWindows.size >= 5000) return res.status(429).json({ message: "أعد المحاولة بعد قليل" });
    window = { count: 0, until: now + 15 * 60 * 1000 };
    invitationWindows.set(key, window);
  }
  if (++window.count > 200) return res.status(429).set("Retry-After", String(Math.ceil((window.until - now) / 1000)))
    .json({ message: "محاولات كثيرة؛ أعد المحاولة لاحقًا" });
  next();
};
function safeUser(user: any) {
  const { password, registeredDevices, otpSecret, ...result } = user.toObject ? user.toObject() : user;
  return { ...result, id: String(user._id), mongoId: String(user._id) };
}
function handler(fn: (req: Request, res: Response) => Promise<any>): RequestHandler {
  return (req, res, next) => { void fn(req, res).catch(error => {
    if (error instanceof InstitutionError) return res.status(error.status).json({ message: error.message });
    if (error?.code === 11000) return res.status(409).json({ message: "البيانات أو الحساب مسجل مسبقًا" });
    req.log?.error({ errorName: error?.name, path: req.path }, "Institution request failed");
    return res.status(503).json({ message: "تعذر إكمال العملية؛ لم يتم تفعيل المؤسسة. حاول لاحقًا." });
  }); };
}
function adminActor(req: Request) {
  const sessionAdmin = (req.session as any)?.admin;
  const actor = (req as any).admin || sessionAdmin;
  if (actor?.isDemo || sessionAdmin?.isDemo)
    throw new InstitutionError("أنت مسجل بحساب إدارة تجريبي. سجل الدخول بحساب الإدارة الفعلي لإصدار عقود المؤسسات.", 403);
  const id = String(actor?._id || actor?.adminId || actor?.id || (req.session as any)?.adminId || "");
  if (!mongoose.isValidObjectId(id))
    throw new InstitutionError("تعذر التحقق من هوية حساب الإدارة؛ سجل الدخول مجددًا بحساب الإدارة الفعلي.", 403);
  return id;
}
async function institutionStudentActor(req: Request) {
  const userId = String((req.session as any)?.userId || "");
  if (!mongoose.isValidObjectId(userId)) throw new InstitutionError("سجل الدخول أولًا", 401);
  const [user, membership] = await Promise.all([
    User.findById(userId).select("role").lean() as any,
    membershipForUser(userId),
  ]);
  if (!user || user.role !== "student" || membership?.role !== "student" ||
      membership.status !== "active" || !membership.institutionActive) {
    throw new InstitutionError("الاختبارات المؤسسية متاحة لطلاب المؤسسة النشطة فقط.", 403);
  }
  return { userId, institutionId: membership.institutionId, institutionName: membership.institutionName };
}
function institutionTestDto(test: any, submissions = 0, averagePercentage: number | null = null) {
  return {
    id: String(test._id), title: test.title, examId: test.examId, dueAt: test.dueAt || null,
    status: test.status, createdAt: test.createdAt, submissions, averagePercentage,
  };
}
async function memberActor(req: Request, roles: string[]) {
  const id = String((req.session as any)?.userId || "");
  if (!mongoose.isValidObjectId(id)) throw new InstitutionError("سجل الدخول أولًا", 401);
  const user = await User.findById(id).select("role institutionId phone").lean() as any;
  if (!user) throw new InstitutionError("الحساب غير موجود؛ سجّل الدخول مجددًا", 401);

  let membership = await membershipForUser(id);
  // Repair only a missing row for the exact owner bound to this institution's
  // currently signed, approved contract. Never revive revoked membership.
  if (!membership) {
    const institution = await Institution.findOne({ _id: user.institutionId, adminUserId: id }).lean();
    if (institution && canRestoreActiveInstitutionOwner(user, institution)) {
      await activateInstitutionOwner(institution);
      membership = await membershipForUser(id);
    }
  }
  if (!membership) {
    const pending = user.role === "institution_admin" ? await pendingInstitutionFor(id) : null;
    if (pending) throw new InstitutionError("عقد المؤسسة لم يعتمد بعد. افتح رابط العقد المرسل لرفعه، ثم انتظر اعتماد إدارة المنصة.", 403);
    throw new InstitutionError("حسابك غير مرتبط بعضوية مدير مؤسسة. تواصل مع إدارة قدراتك لمراجعة ربط الحساب.", 403);
  }
  if (membership.status !== "active") throw new InstitutionError("عضوية المؤسسة موقوفة أو ملغاة. تواصل مع مسؤول المؤسسة.", 403);
  if (!membership.institutionActive) {
    const institution = await Institution.findById(membership.institutionId)
      .select("isActive archivedAt suspendedAt contract.status contract.signedObjectKey").lean();
    if (!institution) throw new InstitutionError("بيانات المؤسسة غير موجودة؛ تواصل مع إدارة المنصة.", 403);
    if (institution.archivedAt) throw new InstitutionError("المؤسسة مؤرشفة ولا يمكن فتح لوحتها.", 403);
    if (institution.suspendedAt || !institution.isActive) throw new InstitutionError("المؤسسة موقوفة حاليًا؛ تواصل مع إدارة المنصة.", 403);
    if (institution.contract?.status !== "approved" || !institution.contract?.signedObjectKey)
      throw new InstitutionError("لا تفتح صلاحيات المؤسسة قبل رفع العقد الموقّع واعتماده من إدارة المنصة.", 403);
    throw new InstitutionError("تعذر التحقق من تفعيل المؤسسة. تواصل مع إدارة المنصة.", 403);
  }
  if (user.role !== membership.role) throw new InstitutionError("دور الحساب لا يطابق عضوية المؤسسة. تواصل مع إدارة المنصة لمراجعته.", 403);
  if (!roles.includes(membership.role)) throw new InstitutionError("هذا القسم متاح لمدير المؤسسة فقط.", 403);
  return { userId: id, membership };
}
// Explicit middleware wrapper: successful authorization must continue to the handler.
function guard(roles: string[]): RequestHandler {
  return (req, res, next) => { void memberActor(req, roles).then(actor => {
    (req as any).institutionActor = actor; next();
  }).catch(error => res.status(error.status || 503).json({ message: error.message || "تعذر التحقق من المؤسسة" })); };
}
export function registerInstitutionRoutes(app: Express, deps: Dependencies) {
  const admin: RequestHandler = (req, res, next) => deps.requireAdmin(req, res, error => {
    if (error) return next(error);
    void (async () => {
      const actual: any = await Admin.findById(adminActor(req)).select("isActive").lean();
      if (!actual || actual.isActive === false)
        throw new InstitutionError("سجل الدخول بحساب إدارة فعّال", 403);
      next();
    })().catch(error => {
      if (error instanceof InstitutionError) res.status(error.status).json({ message: error.message });
      else next(error);
    });
  });
  const manager = guard(["institution_admin"]);
  const staff = guard(["institution_admin", "teacher"]);
  registerInstitutionLifecycleRoutes(app, admin, adminActor);
  app.use("/api/teacher", (req, res, next) => {
    const userId = String((req.session as any)?.userId || "");
    if (!mongoose.isValidObjectId(userId)) return next();
    void InstitutionMember.exists({ userId, role: "teacher" }).then(member => {
      if (member) return res.status(403).json({ message: "استخدم لوحة معلم المؤسسة؛ صلاحياتك تقتصر على الطلاب المسندين إليك" });
      next();
    }).catch(() => res.status(503).json({ message: "تعذر التحقق من صلاحيات المؤسسة" }));
  });
  // Retire the old approval path that wrote a one-year account to local JSON
  // without a signed contract. No existing account or institution is deleted.
  app.post("/api/admin/institution-requests/:id/approve", admin, (_req, res) => {
    res.status(409).json({ message: "تفعيل المؤسسات يتطلب عقدًا موقعًا ومعتمدًا. استخدم قسم المؤسسات الجديد.", redirectTo: "/admin/institutions" });
  });
  app.get("/api/admin/institutions", admin, handler(async (_req, res) => {
    const institutions = await Institution.find({ archivedAt: { $exists: false } }).sort({ createdAt: -1 }).lean();
    return res.json({ institutions: institutions.map(institutionDto), storageReady: contractStorageReady() });
  }));
  app.post("/api/admin/institutions", admin, handler(async (req, res) => {
    const institution = await createInstitution(req.body, adminActor(req));
    let setup: any;
    try { setup = await setupInstitutionOwner(institution, adminActor(req)); }
    catch {
      setup = { ownerAccount: { status: "not_created", message: "حُفظت المؤسسة، لكن إعداد حساب المسؤول لم يكتمل؛ راجع بيانات المالك." } };
    }
    return res.status(201).json({ institution: institutionDto(institution), ...setup });
  }));
  app.get("/api/admin/institutions/:id", admin, handler(async (req, res) => {
    return res.json({ institution: institutionDto(await findInstitution(String(req.params.id))),
      members: await institutionalRoster(String(req.params.id)) });
  }));
  app.get("/api/admin/institutions/:id/contract-assets/:kind", admin, handler(async (req, res) => {
    const institution = await findInstitution(String(req.params.id));
    const c = institution.contract;
    const kind = String(req.params.kind);
    if (!c || !["signature", "stamp"].includes(kind)) throw new InstitutionError("الصورة غير موجودة", 404);
    const id = kind === "signature" ? c.signatureAssetId : c.stampAssetId;
    const sha256 = kind === "signature" ? c.signatureSha256 : c.stampSha256;
    const asset = id ? getInstitutionIssuerAsset(id) : undefined;
    if (!asset) throw new InstitutionError("لا توجد صورة معتمدة لهذا الإصدار من العقد", 404);
    if (asset.sha256 !== sha256) throw new InstitutionError("تغيرت صورة هذا العقد؛ لا يمكن إعادة إصداره بصورة مختلفة", 409);
    return res.set({ "Content-Type": "image/png", "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff" }).send(asset.bytes);
  }));
  app.post("/api/admin/institutions/:id/signed-contract", admin,
    (req, res, next) => upload.single("file")(req, res, error => error ?
      res.status(400).json({ message: "ارفع ملف PDF واحدًا لا يزيد عن ١٢ ميجابايت" }) : next()),
    handler(async (req, res) => {
      const actorId = adminActor(req);
      const institution = await findInstitution(String(req.params.id));
      if (!institution.contract || !["issued", "rejected"].includes(institution.contract.status)) throw new InstitutionError("العقد معتمد أو قيد المراجعة؛ لا يمكن استبداله", 409);
      if (!req.file || req.body.reference !== institution.contract.reference) throw new InstitutionError("اختر النسخة الموقعة للعقد الحالي");
      try { validateSignedPdf(req.file.buffer); }
      catch (error) { throw new InstitutionError((error as Error).message); }
      if (!contractStorageReady()) throw new InstitutionError("التخزين الدائم المشفّر للعقود غير مهيأ", 503);
      const reference = institution.contract.reference;
      const stored = await storeSignedContract(req.file.buffer, `${institution._id}:${reference}`);
      const updated = await Institution.findOneAndUpdate({
        _id: institution._id, "contract.reference": reference,
        "contract.status": { $in: ["issued", "rejected"] },
      }, { $set: {
        "contract.signedObjectKey": stored.objectKey, "contract.signedSha256": stored.sha256,
        "contract.signedBytes": stored.bytes, "contract.signedUploadedAt": new Date(),
        "contract.signedUploadedBy": actorId, "contract.status": "submitted",
      }, $unset: { "contract.rejectionReason": "" } }, { new: true });
      if (!updated) throw new InstitutionError("تغيّرت حالة العقد أثناء الرفع؛ لم يتم استبدال النسخة الحالية", 409);
      return res.json({ institution: institutionDto(updated) });
    }));
  app.get("/api/admin/institutions/:id/signed-contract", admin, handler(async (req, res) => {
    const institution = await findInstitution(String(req.params.id));
    const c = institution.contract;
    if (!c?.signedObjectKey) throw new InstitutionError("لم ترفع نسخة موقعة بعد", 404);
    const pdf = await loadSignedContract(c.signedObjectKey, `${institution._id}:${c.reference}`, c.signedSha256);
    return res.type("application/pdf").set("Cache-Control", "no-store")
      .set("Content-Disposition", `attachment; filename="${c.reference}.pdf"`).send(pdf);
  }));
  app.post("/api/admin/institutions/:id/approve", admin, handler(async (req, res) => {
    const actorId = adminActor(req);
    if (req.body.reviewedSignedContract !== true) throw new InstitutionError("يجب مراجعة النسخة الموقعة والإقرار باعتمادها");
    if (typeof req.body.signedSha256 !== "string" || !/^[a-f0-9]{64}$/.test(req.body.signedSha256)) throw new InstitutionError("راجع بصمة النسخة الموقعة الحالية");
    const now = new Date();
    const session = await mongoose.startSession();
    let institution: any;
    try { await session.withTransaction(async () => {
    institution = await Institution.findOneAndUpdate({
      _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null,
      archivedAt: { $exists: false },
      "contract.status": "submitted", "contract.signedObjectKey": { $exists: true },
      "contract.signedSha256": req.body.signedSha256,
    }, { $set: {
      "contract.status": "approved", "contract.approvedAt": now, "contract.approvedBy": actorId,
      isActive: true, activatedAt: now, subscriptionEndDate: threeMonthsAfter(now),
    }, $unset: { suspendedAt: "" } }, { new: true, session });
    if (!institution) throw new InstitutionError("لا توجد نسخة حالية موقعة تنتظر الاعتماد، أو سبق اعتماد العقد", 409);
    await activateInstitutionOwner(institution, session);
    }); } finally { await session.endSession(); }
    let notification: any;
    try { notification = await notifyInstitutionActivation(institution, actorId); }
    catch { notification = { status: "failed", message: "تم التفعيل، لكن إرسال تعليمات الدخول لم يكتمل؛ أعد إرسال الدعوة." }; }
    return res.json({ institution: institutionDto(institution), notification });
  }));
  app.post("/api/admin/institutions/:id/reject", admin, handler(async (req, res) => {
    adminActor(req);
    const reason = String(req.body.reason || "").trim().slice(0, 1000);
    if (reason.length < 5) throw new InstitutionError("وضح سبب رفض النسخة الموقعة");
    const institution = await Institution.findOneAndUpdate({
      _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null, "contract.status": "submitted",
    }, {
      $set: { "contract.status": "rejected", "contract.rejectionReason": reason, isActive: false },
      $unset: { "contract.portalSentAt": "", "contract.portalDeliveryStatus": "" },
    }, { new: true });
    if (!institution) throw new InstitutionError("لا توجد نسخة تنتظر المراجعة", 409);
    return res.json({ institution: institutionDto(institution) });
  }));
  app.post("/api/admin/institutions/:id/availability", admin, handler(async (req, res) => {
    adminActor(req);
    const institution = await findInstitution(String(req.params.id));
    if (institution.contract?.status !== "approved") throw new InstitutionError("لا يمكن التفعيل قبل اعتماد العقد", 409);
    if (typeof req.body.active !== "boolean") throw new InstitutionError("حدد حالة المؤسسة");
    await Institution.updateOne({ _id: institution._id }, req.body.active ?
      { $set: { isActive: true }, $unset: { suspendedAt: "" } } :
      { $set: { isActive: false, suspendedAt: new Date() }, $inc: { memberRevision: 1 } });
    return res.json({ institution: institutionDto(await findInstitution(String(institution._id))) });
  }));
  app.get("/api/admin/institutions/:id/invites", admin, handler(async (req, res) => {
    await findInstitution(String(req.params.id));
    return res.json({ invites: (await InstitutionInvite.find({ institutionId: req.params.id }).sort({ createdAt: -1 }).lean()).map(inviteDto) });
  }));
  app.post("/api/admin/institutions/:id/invites", admin, handler(async (req, res) =>
    res.status(201).json(await issueInvite(String(req.params.id), req.body, adminActor(req), true))));
  app.post("/api/admin/institutions/:id/invites/:inviteId/revoke", admin, handler(async (req, res) => {
    adminActor(req);
    if (!mongoose.isValidObjectId(req.params.inviteId)) throw new InstitutionError("الكود غير موجود", 404);
    const invite = await InstitutionInvite.findOneAndUpdate({ _id: req.params.inviteId, institutionId: req.params.id },
      { $set: { revokedAt: new Date() } });
    if (!invite) throw new InstitutionError("الكود غير موجود", 404);
    return res.json({ success: true });
  }));
  app.post("/api/institutions/preview", invitationLimit, handler(async (req, res) => {
    const { institution, invite } = await validateInvite(req.body.code);
    return res.json({ institutionName: institution.name, role: invite.role,
      freeMonths: 3, individualStart: invite.role === "student", requiresBoundPhone: Boolean(invite.boundPhone) });
  }));
  app.post("/api/institutions/register", invitationLimit, handler(async (req, res) => {
    const { fullName, username, email, password, phone, phoneVerificationToken, code } = req.body;
    if (req.body.consent !== true) throw new InstitutionError("يجب الموافقة على الانضمام ومشاركة بيانات التعلّم مع المؤسسة");
    if (typeof password !== "string" || password.length < 8 || password.length > 128 ||
        typeof username !== "string" || username.trim().length < 3 || username.length > 60 ||
        typeof fullName !== "string" || fullName.trim().length < 3 || fullName.length > 160) throw new InstitutionError("أكمل الاسم واسم المستخدم وكلمة مرور من ٨ أحرف على الأقل");
    if (!deps.verifyPhoneVerificationToken(phoneVerificationToken, phone, "signup")) throw new InstitutionError("أكد رقم الجوال قبل إنشاء الحساب");
    const normalizedPhone = normalizeInstitutionPhone(phone);
    await validateInvite(code, normalizedPhone);
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : undefined;
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new InstitutionError("البريد الإلكتروني غير صالح");
    const passwordHash = await bcrypt.hash(password, 12);
    const session = await mongoose.startSession();
    let userId = "";
    try {
      await session.withTransaction(async () => {
        const duplicate = await User.findOne({ $or: [
          { username: username.trim() }, { phone: normalizedPhone },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ] }).session(session);
        if (duplicate) throw new InstitutionError("الحساب أو رقم الجوال مسجل؛ سجل الدخول ثم انضم بالكود", 409);
        const [user] = await User.create([{
          fullName: fullName.trim(), username: username.trim(), password: passwordHash,
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
          phone: normalizedPhone, whatsappPhone: normalizedPhone, role: "student",
          trialUsed: true, trialStartDate: new Date(), trialEndDate: new Date(),
        }], { session });
        userId = String(user._id);
        await joinInstitution(userId, String(code), session);
      });
    } finally { await session.endSession(); }
    const user = await User.findById(userId);
    if (!user) throw new InstitutionError("تعذر حفظ الحساب", 503);
    await new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    const auth = req.session as any;
    auth.userId = userId; auth.userRole = user.role; auth.userEmail = user.email;
    auth.institutionId = String(user.institutionId); auth.isAdmin = false; delete auth.adminId;
    await new Promise<void>((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    return res.status(201).json(safeUser(user));
  }));
  app.post("/api/institutions/join", invitationLimit, handler(async (req, res) => {
    const userId = String((req.session as any)?.userId || "");
    if (!mongoose.isValidObjectId(userId)) throw new InstitutionError("سجل الدخول أولًا", 401);
    if (req.body.consent !== true) throw new InstitutionError("يجب الموافقة على مشاركة بيانات التعلّم مع المؤسسة");
    const user = await User.findById(userId).select("phone").lean();
    if (!user) throw new InstitutionError("الحساب غير موجود", 404);
    const { invite } = await validateInvite(req.body.code, user.phone || "");
    if (invite.boundPhone && !deps.verifyPhoneVerificationToken(req.body.phoneVerificationToken, user.phone, "signup")) {
      throw new InstitutionError("أكد رقم الجوال بالرمز قبل الانضمام بصفة معلم أو مدير");
    }
    const membership = await joinInstitution(userId, req.body.code);
    await new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    (req.session as any).userId = userId;
    (req.session as any).userEmail = (await User.findById(userId).select("email").lean())?.email;
    (req.session as any).userRole = membership?.role;
    (req.session as any).institutionId = membership?.institutionId;
    await new Promise<void>((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    return res.json({ membership, user: safeUser(await User.findById(userId)) });
  }));
  app.get("/api/institution/membership", handler(async (req, res) => {
    const id = String((req.session as any)?.userId || "");
    if (!mongoose.isValidObjectId(id) || !await User.exists({ _id: id })) throw new InstitutionError("سجل الدخول أولًا", 401);
    const membership = await membershipForUser(id);
    return res.json({ membership, pendingInstitution: !membership ? await pendingInstitutionFor(id) : null });
  }));
  app.get("/api/institution/dashboard", staff, handler(async (req, res) => {
    const actor = (req as any).institutionActor;
    const institution = await findInstitution(actor.membership.institutionId);
    const members = await institutionalRoster(actor.membership.institutionId,
      actor.membership.role === "teacher" ? actor.userId : undefined);
    return res.json({ institution: institutionDto(institution), members,
      role: actor.membership.role, membership: actor.membership });
  }));
  app.get("/api/institution/assignments", manager, handler(async (req, res) => {
    const { membership } = (req as any).institutionActor;
    const assignments = await InstitutionTestAssignment.find({ institutionId: membership.institutionId })
      .sort({ createdAt: -1 }).limit(100).lean();
    const ids = assignments.map((test: any) => String(test._id));
    const stats = ids.length ? await TestResult.aggregate([
      { $match: { institutionTestAssignmentId: { $in: ids } } },
      { $group: { _id: "$institutionTestAssignmentId", submissions: { $sum: 1 }, averagePercentage: { $avg: "$percentage" } } },
    ]) : [];
    const statMap = new Map(stats.map((row: any) => [String(row._id), row]));
    return res.json({ assignments: assignments.map((test: any) => {
      const stat: any = statMap.get(String(test._id));
      return institutionTestDto(test, stat?.submissions || 0,
        typeof stat?.averagePercentage === "number" ? Math.round(stat.averagePercentage) : null);
    }) });
  }));
  app.post("/api/institution/assignments", manager, handler(async (req, res) => {
    const actor = (req as any).institutionActor;
    const title = typeof req.body.title === "string" ? req.body.title.trim().slice(0, 120) : "";
    const examId = Number(req.body.examId);
    if (title.length < 3 || !Number.isInteger(examId) || examId < 1 || examId > 10) {
      throw new InstitutionError("أدخل اسمًا واضحًا واختر اختبارًا متاحًا.", 400);
    }
    let dueAt: Date | null = null;
    if (req.body.dueAt) {
      dueAt = new Date(req.body.dueAt);
      if (Number.isNaN(dueAt.getTime()) || dueAt <= new Date() ||
          dueAt.getTime() > Date.now() + 366 * 86400_000) {
        throw new InstitutionError("موعد الإغلاق يجب أن يكون مستقبليًا وخلال سنة.", 400);
      }
    }
    const test = await InstitutionTestAssignment.create({
      institutionId: actor.membership.institutionId, createdBy: actor.userId,
      title, examId, dueAt, status: "active",
    });
    return res.status(201).json({ assignment: institutionTestDto(test) });
  }));
  app.post("/api/institution/assignments/:id/close", manager, handler(async (req, res) => {
    const { membership } = (req as any).institutionActor;
    if (!mongoose.isValidObjectId(req.params.id)) throw new InstitutionError("الاختبار غير موجود", 404);
    const test = await InstitutionTestAssignment.findOneAndUpdate({
      _id: req.params.id, institutionId: membership.institutionId, status: "active",
    }, { $set: { status: "closed" } }, { new: true });
    if (!test) throw new InstitutionError("الاختبار غير موجود أو مغلق", 404);
    return res.json({ assignment: institutionTestDto(test) });
  }));
  app.get("/api/institution/assignments/:id/results", manager, handler(async (req, res) => {
    const { membership } = (req as any).institutionActor;
    if (!mongoose.isValidObjectId(req.params.id)) throw new InstitutionError("الاختبار غير موجود", 404);
    const test = await InstitutionTestAssignment.findOne({
      _id: req.params.id, institutionId: membership.institutionId,
    }).lean();
    if (!test) throw new InstitutionError("الاختبار غير موجود", 404);
    const students = await InstitutionMember.find({
      institutionId: membership.institutionId, role: "student", status: "active",
    }).select("userId").lean();
    const userIds = students.map((student: any) => String(student.userId));
    const [users, results] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select("fullName").lean(),
      TestResult.find({ institutionTestAssignmentId: String(test._id), userId: { $in: userIds } })
        .sort({ percentage: -1, completedAt: -1 })
        .select("userId percentage correctAnswers wrongAnswers skippedQuestions totalQuestions timeTaken completedAt testName").lean(),
    ]);
    const names = new Map(users.map((user: any) => [String(user._id), user.fullName]));
    const byUser = new Map(results.map((result: any) => [String(result.userId), result]));
    return res.json({
      assignment: institutionTestDto(test),
      results: userIds.map(userId => {
        const result: any = byUser.get(userId);
        return result ? { ...result, fullName: names.get(userId) || "طالب", completed: true } :
          { userId, fullName: names.get(userId) || "طالب", completed: false };
      }).sort((a, b) => Number(b.percentage ?? -1) - Number(a.percentage ?? -1)),
    });
  }));
  app.get("/api/institution/student/assignments", handler(async (req, res) => {
    const actor = await institutionStudentActor(req);
    const assignments = await InstitutionTestAssignment.find({
      institutionId: actor.institutionId,
    }).sort({ createdAt: -1 }).limit(100).lean();
    const ids = assignments.map((test: any) => String(test._id));
    const results = ids.length ? await TestResult.find({
      userId: actor.userId, institutionTestAssignmentId: { $in: ids },
    }).select("institutionTestAssignmentId percentage completedAt testName").lean() : [];
    const resultMap = new Map(results.map((row: any) => [String(row.institutionTestAssignmentId), row]));
    const now = new Date();
    return res.json({ institutionName: actor.institutionName, assignments: assignments.map((test: any) => {
      const result: any = resultMap.get(String(test._id));
      const expired = test.status !== "active" || Boolean(test.dueAt && new Date(test.dueAt) <= now);
      return {
        ...institutionTestDto(test), completed: Boolean(result), expired,
        percentage: typeof result?.percentage === "number" ? result.percentage : null,
        completedAt: result?.completedAt || null,
      };
    }) });
  }));
  app.get("/api/institution/invites", manager, handler(async (req, res) => {
    const { membership } = (req as any).institutionActor;
    return res.json({ invites: (await InstitutionInvite.find({ institutionId: membership.institutionId }).sort({ createdAt: -1 }).lean()).map(inviteDto) });
  }));
  app.post("/api/institution/invites", manager, handler(async (req, res) => {
    const actor = (req as any).institutionActor;
    return res.status(201).json(await issueInvite(actor.membership.institutionId, req.body, actor.userId, false));
  }));
  app.post("/api/institution/invites/:inviteId/revoke", manager, handler(async (req, res) => {
    const actor = (req as any).institutionActor;
    if (!mongoose.isValidObjectId(req.params.inviteId)) throw new InstitutionError("الكود غير موجود", 404);
    const result = await InstitutionInvite.updateOne({
      _id: req.params.inviteId, institutionId: actor.membership.institutionId,
    }, { $set: { revokedAt: new Date() } });
    if (!result.matchedCount) throw new InstitutionError("الكود غير موجود", 404);
    return res.json({ success: true });
  }));
  app.post("/api/institution/members/:memberId/teachers", manager, handler(async (req, res) => {
    const actor = (req as any).institutionActor;
    const ids = req.body.teacherIds;
    if (!mongoose.isValidObjectId(req.params.memberId) || !Array.isArray(ids) || ids.length > 50 ||
        ids.some(id => !mongoose.isValidObjectId(id)) || new Set(ids).size !== ids.length) throw new InstitutionError("اختر المعلمين بشكل صحيح");
    const teachers = await InstitutionMember.countDocuments({
      institutionId: actor.membership.institutionId, role: "teacher", status: "active", userId: { $in: ids },
    });
    if (teachers !== ids.length) throw new InstitutionError("لا يمكن تعيين معلم من مؤسسة أخرى", 403);
    const updated = await InstitutionMember.updateOne({
      _id: req.params.memberId, institutionId: actor.membership.institutionId, role: "student", status: "active",
    }, { $set: { teacherIds: ids } });
    if (!updated.matchedCount) throw new InstitutionError("الطالب غير موجود في مؤسستك", 404);
    return res.json({ success: true });
  }));
  app.post("/api/institution/members/:memberId/revoke", manager, handler(async (req, res) => {
    const actor = (req as any).institutionActor;
    if (!mongoose.isValidObjectId(req.params.memberId)) throw new InstitutionError("العضو غير موجود", 404);
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const member = await InstitutionMember.findOne({
          _id: req.params.memberId, institutionId: actor.membership.institutionId,
          role: { $in: ["student", "teacher"] }, status: "active",
        }).session(session);
        if (!member) throw new InstitutionError("العضو غير موجود أو لا يمكن إلغاء مدير المؤسسة", 404);
        await InstitutionMember.updateOne({ _id: member._id }, { $set: { status: "revoked", revokedAt: new Date() } }, { session });
        await User.updateOne({ _id: member.userId }, { $set: { role: "student" } }, { session });
      });
    } finally { await session.endSession(); }
    return res.json({ success: true });
  }));
  app.get("/api/institution/students/:userId/results", staff, handler(async (req, res) => {
    const actor = (req as any).institutionActor;
    if (!mongoose.isValidObjectId(req.params.userId)) throw new InstitutionError("الطالب غير موجود", 404);
    const member = await InstitutionMember.exists({
      institutionId: actor.membership.institutionId, userId: req.params.userId,
      role: "student", status: "active",
      ...(actor.membership.role === "teacher" ? { teacherIds: actor.userId } : {}),
    });
    if (!member) throw new InstitutionError("الطالب ليس ضمن صلاحياتك", 404);
    const results = await TestResult.find({ userId: req.params.userId })
      .sort({ completedAt: -1 }).limit(100).select("testName testType program percentage score totalQuestions correctAnswers wrongAnswers skippedQuestions completedAt timeTaken weakAreas strongAreas").lean();
    return res.json({ results });
  }));
}
