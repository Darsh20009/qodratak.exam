import type { Express, Request, RequestHandler } from "express";
import multer from "multer";
import { Institution } from "../mongodb/models";
import { InstitutionContractDelivery, InstitutionInvite } from "../mongodb/institutionModels";
import { institutionCreationData, findInstitution, InstitutionError, institutionDto } from "../services/institutionService";
import { contractLink, institutionMessage, resolveContractToken, setupInstitutionOwner } from "../services/institutionLifecycle";
import { contractStorageReady, loadSignedContract, storeSignedContract, validateSignedPdf } from "../services/institutionContractStorage";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 1 } });
const pdf: RequestHandler = (req, res, next) => upload.single("file")(req, res, error =>
  error ? res.status(400).json({ message: "ارفع PDF واحدًا لا يتجاوز ١٢ ميجابايت" }) : next());
const route = (fn: (req: Request, res: any) => Promise<any>): RequestHandler => (req, res, next) => {
  void fn(req, res).catch(error => {
    if (error instanceof InstitutionError) return res.status(error.status).json({ message: error.message });
    req.log?.error({ errorName: error?.name }, "Institution lifecycle operation failed");
    res.status(503).json({ message: "تعذر إكمال العملية. احتفظ بالبيانات وأعد المحاولة." });
  });
};
const bearer = (req: Request) => req.headers.authorization?.replace(/^Bearer\s+/i, "");
function checkPdf(req: Request) {
  if (!req.file) throw new InstitutionError("اختر ملف PDF");
  try { validateSignedPdf(req.file.buffer); } catch (e) { throw new InstitutionError((e as Error).message); }
  if (!contractStorageReady()) throw new InstitutionError("التخزين الدائم المشفّر للعقود غير مهيأ", 503);
  return req.file.buffer;
}
export function registerInstitutionLifecycleRoutes(app: Express, admin: RequestHandler, adminActor: (req: Request) => string) {
  app.post("/api/admin/institutions/:id/issued-contract", admin, pdf, route(async (req, res) => {
    const institution = await findInstitution(String(req.params.id));
    if (institution.archivedAt || !institution.contract || institution.contract.status !== "issued" ||
        req.body.reference !== institution.contract.reference) throw new InstitutionError("لا يمكن استبدال هذا العقد", 409);
    const reference = institution.contract.reference;
    const stored = await storeSignedContract(checkPdf(req), `${institution._id}:${reference}:issued`);
    const updated = await Institution.findOneAndUpdate({
      _id: institution._id, "contract.reference": reference, "contract.status": "issued",
      archivedAt: { $exists: false }, "contract.portalSentAt": { $exists: false },
    }, { $set: { "contract.issuedObjectKey": stored.objectKey, "contract.issuedSha256": stored.sha256,
      "contract.issuedBytes": stored.bytes } }, { new: true });
    if (!updated) throw new InstitutionError("سبق إرسال العقد أو تغير إصداره؛ لا يمكن استبدال نسخته", 409);
    res.json({ institution: institutionDto(updated) });
  }));
  app.post("/api/admin/institutions/:id/send-contract", admin, route(async (req, res) => {
    const institution = await findInstitution(String(req.params.id));
    if (!institution.contract?.issuedObjectKey) throw new InstitutionError("جهّز ملف PDF وارفعه قبل إرسال العقد", 409);
    const url = await contractLink(institution);
    await Institution.updateOne({ _id: institution._id }, { $set: {
      "contract.portalSentAt": new Date(), "contract.portalDeliveryStatus": "queued",
    } });
    const notification = await institutionMessage(institution.phone || "", [
      `عقد ${institution.name} من منصة قدراتك التعليمية`,
      "افتح الرابط لتنزيل PDF وقراءته وتوقيعه ثم إعادة إرفاق النسخة الموقعة:", url,
      "صلاحية الرابط ٧ أيام. التفعيل بعد مراجعة الإدارة.",
    ].join("\n"), "institution_contract", status => Institution.updateOne({
      _id: institution._id, "contract.reference": institution.contract.reference,
    }, { $set: { "contract.portalDeliveryStatus": status } }));
    // Freeze the exact document once its recipient link has been distributed.
    res.json({ url, notification });
  }));
  app.post("/api/admin/institutions/:id/send-welcome", admin, route(async (req, res) =>
    res.json(await setupInstitutionOwner(await findInstitution(String(req.params.id)), adminActor(req)))));
  app.patch("/api/admin/institutions/:id", admin, route(async (req, res) => {
    const institution = await findInstitution(String(req.params.id));
    if (institution.archivedAt) throw new InstitutionError("المؤسسة محذوفة من القائمة", 409);
    const legal = ["name", "email", "maxStudents", "maxTeachers"];
    const changingLegal = legal.some(key => req.body[key] !== undefined && String(req.body[key]).trim() !== String((institution as any)[key]));
    const locked = institution.contract?.status !== "issued" || institution.contract?.portalSentAt || institution.contract?.issuedObjectKey;
    if (changingLegal && locked) throw new InstitutionError("بيانات العقد الصادر ثابتة؛ يمكن تعديل بيانات التواصل فقط بعد تجهيزه أو إرساله", 409);
    const set: any = {};
    for (const key of ["phone", "city", "address", "ownerName"]) if (req.body[key] !== undefined) {
      if (typeof req.body[key] !== "string" || req.body[key].length > (key === "address" ? 300 : 180))
        throw new InstitutionError("بيانات التواصل غير صحيحة");
      set[key] = req.body[key].trim();
    }
    if (changingLegal) {
      const draft = institutionCreationData({
        name: req.body.name ?? institution.name, email: req.body.email ?? institution.email,
        type: institution.type, maxStudents: req.body.maxStudents ?? institution.maxStudents,
        maxTeachers: req.body.maxTeachers ?? institution.maxTeachers,
        issuerAuthorized: req.body.issuerAuthorized, policies: institution.contract.policies,
      }, adminActor(req));
      set.name = String(req.body.name ?? institution.name).trim();
      set.email = String(req.body.email ?? institution.email).trim().toLowerCase();
      if (set.name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(set.email))
        throw new InstitutionError("الاسم أو البريد غير صحيح");
      set.maxStudents = draft.maxStudents; set.maxTeachers = draft.maxTeachers;
      set.contract = draft.contract;
    }
    if (set.phone !== undefined && set.phone !== institution.phone) {
      await InstitutionContractDelivery.updateMany({ institutionId: institution._id }, { $set: { revokedAt: new Date() } });
    }
    const updated = await Institution.findOneAndUpdate({ _id: institution._id }, { $set: set }, { new: true });
    res.json({ institution: institutionDto(updated) });
  }));
  app.delete("/api/admin/institutions/:id", admin, route(async (req, res) => {
    const institution = await findInstitution(String(req.params.id));
    if (req.body?.confirmation !== undefined && req.body.confirmation !== institution.name)
      throw new InstitutionError("اكتب اسم المؤسسة لتأكيد الحذف");
    await Institution.updateOne({ _id: institution._id }, { $set: {
      archivedAt: new Date(), archivedBy: adminActor(req), isActive: false, suspendedAt: new Date(),
    }, $inc: { memberRevision: 1 } });
    await InstitutionContractDelivery.updateMany({ institutionId: institution._id }, { $set: { revokedAt: new Date() } });
    await InstitutionInvite.updateMany({ institutionId: institution._id, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    res.json({ success: true, archived: true, message: "أُخفيت المؤسسة وأُوقف الوصول؛ الحسابات والنتائج والعقود محفوظة" });
  }));
  app.post("/api/institutions/contract-portal", route(async (req, res) => {
    const institution = await resolveContractToken(req.body.token);
    const status = institution.contract.status;
    res.set("Cache-Control", "no-store").json({
      institution: institutionDto(institution), documentReady: Boolean(institution.contract.issuedObjectKey),
      reference: institution.contract.reference, submitted: ["submitted", "approved"].includes(status),
      canUpload: ["issued", "rejected"].includes(status), ownerAccountPending: !institution.isActive,
    });
  }));
  app.get("/api/institutions/contract-portal/pdf", route(async (req, res) => {
    const institution = await resolveContractToken(bearer(req));
    const c = institution.contract;
    if (!c.issuedObjectKey) throw new InstitutionError("العقد قيد التجهيز؛ اطلب من الإدارة إكمال تجهيزه", 409);
    const buffer = await loadSignedContract(c.issuedObjectKey, `${institution._id}:${c.reference}:issued`, c.issuedSha256);
    res.set({ "Cache-Control": "no-store", "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Qodratak-Institution-Contract.pdf"' }).send(buffer);
  }));
  app.post("/api/institutions/contract-portal/upload", pdf, route(async (req, res) => {
    const institution = await resolveContractToken(bearer(req));
    const reference = institution.contract.reference;
    if (req.body.reference !== reference || req.body.consent !== "true" ||
        typeof req.body.signerName !== "string" || req.body.signerName.trim().length < 3)
      throw new InstitutionError("أدخل اسم المفوّض وأقرّ بصلاحية رفع العقد الموقّع");
    if (!["issued", "rejected"].includes(institution.contract.status)) throw new InstitutionError("سبق إرسال هذه النسخة للمراجعة", 409);
    const stored = await storeSignedContract(checkPdf(req), `${institution._id}:${reference}`);
    const updated = await Institution.findOneAndUpdate({
      _id: institution._id, archivedAt: { $exists: false }, "contract.reference": reference,
      "contract.status": { $in: ["issued", "rejected"] },
    }, { $set: {
      "contract.signedObjectKey": stored.objectKey, "contract.signedSha256": stored.sha256,
      "contract.signedBytes": stored.bytes, "contract.signedUploadedAt": new Date(),
      "contract.signedUploadedBy": `recipient:${req.body.signerName.trim().slice(0, 160)}`,
      "contract.status": "submitted",
    }, $unset: { "contract.rejectionReason": "" } }, { new: true });
    if (!updated) throw new InstitutionError("تغيرت حالة العقد أثناء الرفع؛ لم تُستبدل النسخة", 409);
    res.json({ submitted: true, message: "وصلت النسخة الموقعة إلى الإدارة؛ التفعيل بعد المراجعة والاعتماد" });
  }));
}
