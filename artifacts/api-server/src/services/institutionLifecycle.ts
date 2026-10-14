import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Institution, User } from "../mongodb/models";
import { InstitutionContractDelivery, InstitutionMember } from "../mongodb/institutionModels";
import { activeInstitution, InstitutionError, issueInvite, normalizeInstitutionPhone, threeMonthsAfter } from "./institutionService";
import { openContract, sealContract } from "./institutionContractStorage";
import type { WhatsAppOutboundKind } from "./whatsappService";
import { transactionalWhatsApp } from "./transactionalWhatsApp";

// External Render domain supplied by the project owner, not the Replit preview domain.
const origin = "https://qodratak.sa";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export async function institutionMessage(phone: string, text: string, kind: WhatsAppOutboundKind, settled?: (status: "sent" | "failed") => Promise<unknown>) {
  try {
    const status = await transactionalWhatsApp(normalizeInstitutionPhone(phone), text, kind, settled);
    return { status, message: status === "sent" ? "أُرسلت رسالة واتساب"
      : status === "queued" ? "الرسالة في طابور الإرسال؛ لم يُؤكد تسليمها بعد"
      : "حُفظت البيانات، لكن تعذر إرسال رسالة واتساب؛ يمكنك إعادة الإرسال." };
  } catch {
    return { status: "failed", message: "حُفظت البيانات، لكن تعذر إرسال رسالة واتساب؛ يمكنك إعادة الإرسال." };
  }
}
export function contractDeliveryAlreadyClaimed(contract: { portalSentAt?: Date | string; portalDeliveryStatus?: string }) {
  return Boolean(contract.portalSentAt) && contract.portalDeliveryStatus !== "failed";
}
export async function contractLink(institution: any) {
  if (!institution.contract || institution.archivedAt) throw new InstitutionError("المؤسسة غير متاحة", 409);
  const reference = institution.contract.reference;
  const targetPhone = normalizeInstitutionPhone(institution.phone);
  const context = `${institution._id}:${reference}:portal-token`;
  let delivery = await InstitutionContractDelivery.findOne({
    institutionId: institution._id, reference, targetPhone,
    revokedAt: { $exists: false }, expiresAt: { $gt: new Date() },
  }).select("+sealedToken");
  let token: string;
  if (delivery) token = openContract(delivery.sealedToken, context).toString("utf8");
  else {
    token = randomBytes(32).toString("base64url");
    delivery = await InstitutionContractDelivery.create({
      institutionId: institution._id, reference, targetPhone, tokenHash: hash(token),
      sealedToken: sealContract(Buffer.from(token), context),
      expiresAt: new Date(Date.now() + 7 * 86400_000),
    });
  }
  return `${origin}/institution-contract#token=${token}`;
}
export async function resolveContractToken(token: unknown) {
  if (typeof token !== "string" || !/^[\w-]{43}$/.test(token))
    throw new InstitutionError("رابط العقد غير صالح", 403);
  const delivery = await InstitutionContractDelivery.findOne({
    tokenHash: hash(token), expiresAt: { $gt: new Date() }, revokedAt: { $exists: false },
  });
  const institution = delivery && await Institution.findById(delivery.institutionId);
  if (!delivery || !institution || institution.archivedAt ||
      institution.contract?.reference !== delivery.reference)
    throw new InstitutionError("الرابط منتهي أو أُلغي؛ اطلب من الإدارة إعادة إرسال العقد", 403);
  return institution;
}
export async function setupInstitutionOwner(institution: any, actorId?: string) {
  let phone: string;
  try { phone = normalizeInstitutionPhone(institution.phone); }
  catch { return { ownerAccount: { status: "not_created", message: "لم يُنشأ حساب المسؤول: أضف رقم جواله الصحيح." }, notification: { status: "missing_phone", message: "رقم الجوال غير موجود" } }; }
  let owner = institution.adminUserId ? await User.findById(institution.adminUserId) : null;
  let status = "existing";
  if (!owner) {
    const variants = [phone, `+${phone}`, ...(phone.startsWith("966") ? [`0${phone.slice(3)}`] : [])];
    const existing = await User.findOne({ $or: [
      { phone: { $in: variants } }, { whatsappPhone: { $in: variants } },
    ] });
    if (existing && await InstitutionMember.exists({
      userId: existing._id, institutionId: institution._id, role: "institution_admin", status: "active",
    })) {
      owner = existing;
      institution.adminUserId = owner._id; institution.ownerAccountPhone = phone;
      await institution.save();
    }
    if (!existing) {
      const emailInUse = await User.exists({ email: institution.email.toLowerCase() });
      owner = await User.create({
        username: `institution-${randomUUID()}`, fullName: institution.ownerName || institution.name,
        ...(emailInUse ? {} : { email: institution.email.toLowerCase() }),
        phone, whatsappPhone: phone, role: "institution_admin", institutionId: institution._id,
        // Existing verified-OTP flow asks the owner to choose a password on first login.
        password: "external-auth",
        trialUsed: true, trialStartDate: new Date(), trialEndDate: new Date(),
      });
      institution.adminUserId = owner._id;
      institution.ownerAccountPhone = phone;
      await institution.save();
      status = "created";
    }
  }
  if (owner && !institution.ownerAccountPhone) {
    institution.ownerAccountPhone = owner.phone;
    await institution.save();
  }
  let inviteLink: string | undefined;
  if (!owner && activeInstitution(institution) && actorId) {
    const invite = await issueInvite(String(institution._id), {
      role: "institution_admin", boundPhone: phone, label: "مسؤول المؤسسة",
    }, actorId, true);
    inviteLink = `${origin}/invite?code=${encodeURIComponent(invite.code)}`;
  }
  const ownerAccount = {
    status, phone: owner ? normalizeInstitutionPhone(owner.phone || owner.whatsappPhone || "") : phone,
    message: owner ? activeInstitution(institution)
      ? "حساب مسؤول المؤسسة فعّال؛ سجّل الدخول برقم الحساب ورمز واتساب."
      : "حساب مسؤول المؤسسة جاهز للدخول برمز واتساب؛ صلاحيات المؤسسة تنتظر اعتماد العقد."
      : inviteLink ? "الرقم مرتبط بحساب موجود ولم نغيّر دوره. أكمل الانضمام للمؤسسة برمز الدعوة المرسل بعد التحقق من الجوال."
      : "الرقم مرتبط بحساب موجود ولم نغيّر دوره. بعد اعتماد العقد تُرسل دعوة مسؤول المؤسسة إلى هذا الرقم.",
  };
  return { ownerAccount };
}
export async function activateInstitutionOwner(institution: any, session?: any) {
  if (!institution.adminUserId) return;
  const owner = await User.findOne({
    _id: institution.adminUserId, institutionId: institution._id, role: "institution_admin",
  }).session(session || null);
  if (!owner) throw new InstitutionError("حساب مسؤول المؤسسة غير مطابق؛ راجع الحساب قبل التفعيل", 409);
  const start = institution.activatedAt || new Date();
  await InstitutionMember.updateOne({ userId: owner._id, institutionId: institution._id }, {
    $setOnInsert: {
      userId: owner._id, institutionId: institution._id, role: "institution_admin",
      nameAtJoin: owner.fullName, status: "active", joinedAt: start,
      freeStartDate: start, freeEndDate: threeMonthsAfter(start), teacherIds: [],
    },
  }, { upsert: true, session });
}
export async function notifyInstitutionActivation(institution: any, actorId: string) {
  if (!institution.phone) return { status: "missing_phone", message: "لا يوجد رقم للتنبيه" };
  let access = `${origin}/login`;
  if (!institution.adminUserId) {
    const invite = await issueInvite(String(institution._id), {
      role: "institution_admin", boundPhone: institution.phone, label: "مسؤول المؤسسة",
    }, actorId, true);
    access = `${origin}/invite?code=${encodeURIComponent(invite.code)}`;
  }
  return institutionMessage(institution.phone, [
    `تم اعتماد عقد ${institution.name} وتفعيل المؤسسة في قدراتك.`,
    "بدأت فترة المؤسسة المجانية لمدة ثلاثة أشهر.",
    institution.adminUserId ? "سجّل الدخول برقم جوالك ورمز واتساب." : "أكمل الانضمام برمز الدعوة في الرابط التالي:",
    access,
  ].join("\n"), "institution_contract");
}
export async function pendingInstitutionFor(userId: string) {
  const institution = await Institution.findOne({ adminUserId: userId, archivedAt: { $exists: false } });
  if (!institution || activeInstitution(institution)) return null;
  return {
    name: institution.name, status: institution.contract?.status,
    contractLink: await contractLink(institution),
    documentReady: Boolean(institution.contract?.issuedObjectKey),
  };
}
