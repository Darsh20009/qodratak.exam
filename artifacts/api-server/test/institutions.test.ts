import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import express from "express";
import mongoose from "mongoose";
import { Admin, Institution, User, TestResult, Subscription } from "../src/mongodb/models";
import { InstitutionMember, InstitutionInvite } from "../src/mongodb/institutionModels";
import { registerInstitutionRoutes } from "../src/routes/institutions";
import { createInstitution, issueInvite, joinInstitution, membershipForUser, threeMonthsAfter } from "../src/services/institutionService";
import { ensureStudentAccountTrial } from "../src/middleware/studentTrialAccess";
import { sealContract, openContract, validateSignedPdf } from "../src/services/institutionContractStorage";
import { createPhoneVerificationToken, verifyPhoneVerificationToken } from "../src/services/phoneOtpService";

test("institution grants use three Saudi calendar months, including month-end", () => {
  assert.equal(threeMonthsAfter(new Date("2026-09-30T21:30:00Z")).toISOString(), "2026-12-31T21:30:00.000Z");
  assert.equal(threeMonthsAfter(new Date("2027-01-31T09:00:00Z")).toISOString(), "2027-04-30T09:00:00.000Z");
  assert.equal(threeMonthsAfter(new Date("2026-11-30T09:00:00Z")).toISOString(), "2027-02-28T09:00:00.000Z");
});
test("signed PDFs are encrypted and context-bound; active PDF content is rejected", () => {
  const saved = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = "institution-fixture-key-only";
  try {
    const pdf = Buffer.from("%PDF-1.4\ninstitution test\n%%EOF");
    const encrypted = sealContract(pdf, "one-contract");
    assert.ok(!encrypted.includes(Buffer.from("institution test")));
    assert.deepEqual(openContract(encrypted, "one-contract"), pdf);
    assert.throws(() => openContract(encrypted, "another-contract"));
    encrypted[encrypted.length - 1] ^= 1;
    assert.throws(() => openContract(encrypted, "one-contract"));
    validateSignedPdf(pdf);
    assert.throws(() => validateSignedPdf(Buffer.from("%PDF-1.4\n/JavaScript evil\n%%EOF")));
    assert.throws(() => validateSignedPdf(Buffer.from("not-a-pdf")));
  } finally { if (saved === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = saved; }
});
test("institution activation, registration, assignments, access and isolation are server-owned",
  { skip: !process.env.MONGODB_URI, timeout: 120000 }, async t => {
  const marker = `inst-fixture-${randomUUID()}`;
  const userIds: string[] = [];
  const institutionIds: string[] = [];
  const originalFetch = globalThis.fetch;
  const originalEnv = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries({
    SESSION_SECRET: "institution-integration-fixture-only",
    CLOUDFLARE_R2_ACCOUNT_ID: "a".repeat(32), CLOUDFLARE_R2_BUCKET_NAME: "fixture-contracts",
    CLOUDFLARE_R2_ACCESS_KEY_ID: "fixture-key", CLOUDFLARE_R2_SECRET_ACCESS_KEY: "fixture-password",
  })) { originalEnv.set(key, process.env[key]); process.env[key] = value; }
  const objects = new Map<string, Buffer>();
  globalThis.fetch = (async (target: any, init?: RequestInit) => {
    const url = String(target);
    if (!url.includes(".r2.cloudflarestorage.com/")) return originalFetch(target, init);
    const key = new URL(url).pathname;
    if (init?.method === "PUT") {
      objects.set(key, Buffer.from(init.body as Uint8Array)); return new Response(null, { status: 200 });
    }
    const buffer = objects.get(key);
    return buffer ? new Response(new Uint8Array(buffer)) : new Response(null, { status: 404 });
  }) as typeof fetch;
  await mongoose.connect(process.env.MONGODB_URI!);
  const actorId = String(new mongoose.Types.ObjectId());
  await Admin.create({ _id: actorId, username: `${marker}-admin`,
    password: "synthetic-test-password-not-used", email: `${marker}-admin@example.invalid`,
    fullName: "إدارة اختبار غير حقيقية", role: "super_admin", permissions: ["all"], isActive: true });
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).session = {
      userId: req.headers["x-fixture-user"],
      save(cb: any) { cb(); }, regenerate(cb: any) { delete this.userId; cb(); },
    };
    next();
  });
  registerInstitutionRoutes(app, {
    verifyPhoneVerificationToken,
    requireAdmin(req, res, next) {
      if (req.headers["x-fixture-admin"] !== actorId) return void res.sendStatus(403);
      (req as any).admin = { _id: actorId }; next();
    },
  });
  app.get("/api/teacher/legacy-test", (_req, res) => res.json({ legacy: true }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const request = async (path: string, body?: any, userId?: string, admin = false) => {
    const response = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...(userId ? { "x-fixture-user": userId } : {}),
        ...(admin ? { "x-fixture-admin": actorId } : {}) }, body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json().catch(() => ({})) };
  };
  const input = (suffix: string) => ({ name: `${marker}-${suffix}`, email: `${marker}-${suffix}@example.invalid`,
    type: "school", maxStudents: 2, maxTeachers: 2, issuerName: "مفوض اختبار غير حقيقي",
    issuerAuthorized: true, policies: "سياسات اختبار غير تعاقدي. ".repeat(10) });
  const newUser = async (suffix: string, phone?: string) => {
    const user = await User.create({ fullName: `اختبار ${suffix}`, username: `${marker}-${suffix}`,
      email: `${marker}-${suffix}@example.invalid`, password: "fixture-password-hash", role: "student",
      ...(phone ? { phone } : {}), trialUsed: true, trialEndDate: new Date(0) });
    userIds.push(String(user._id)); return user;
  };
  try {
    await t.test("admin-only creation and draft cannot enroll or approve without a signed copy", async () => {
      assert.equal((await request("/api/admin/institutions", input("denied"))).status, 403);
      const created = await request("/api/admin/institutions", input("one"), undefined, true);
      assert.equal(created.status, 201); institutionIds.push(created.body.institution.id);
      assert.equal(created.body.institution.isActive, false);
      assert.equal((await request(`/api/admin/institutions/${institutionIds[0]}/invites`, { role: "student" }, undefined, true)).status, 409);
      assert.equal((await request(`/api/admin/institutions/${institutionIds[0]}/approve`,
        { reviewedSignedContract: true, signedSha256: "a".repeat(64) }, undefined, true)).status, 409);
      assert.equal((await request("/api/admin/institution-requests/any/approve", {}, undefined, true)).status, 409);
    });
    await t.test("signed upload stays encrypted; wrong PDF rejected; approval starts institution period once", async () => {
      const inst = await Institution.findById(institutionIds[0]);
      const form = new FormData();
      form.set("reference", inst!.contract.reference);
      form.set("file", new Blob(["%PDF-1.4\nsigned synthetic fixture\n%%EOF"], { type: "application/pdf" }), "fixture.pdf");
      const response = await fetch(`${base}/api/admin/institutions/${inst!._id}/signed-contract`,
        { method: "POST", headers: { "x-fixture-admin": actorId }, body: form });
      assert.equal(response.status, 200);
      assert.ok([...objects.values()].every(b => !b.includes(Buffer.from("signed synthetic fixture"))));
      const dto = (await response.json() as any).institution;
      assert.equal((await request(`/api/admin/institutions/${inst!._id}/approve`,
        { reviewedSignedContract: true, signedSha256: dto.contract.signedSha256 }, undefined, true)).status, 200);
      assert.equal((await request(`/api/admin/institutions/${inst!._id}/approve`,
        { reviewedSignedContract: true, signedSha256: dto.contract.signedSha256 }, undefined, true)).status, 409);
    });
    const second = await createInstitution(input("two"), actorId);
    institutionIds.push(String(second._id));
    await Institution.updateOne({ _id: second._id }, { $set: {
      "contract.status": "approved", "contract.signedObjectKey": "synthetic-sealed", isActive: true,
      activatedAt: new Date(), subscriptionEndDate: threeMonthsAfter(new Date()),
    } });
    const manager = await newUser("manager", "966500000001");
    const teacher = await newUser("teacher", "966500000002");
    const student = await newUser("student", "966500000003");
    const outsider = await newUser("outsider", "966500000004");
    const managerInvite = await issueInvite(institutionIds[0], { role: "institution_admin", boundPhone: manager.phone }, actorId, true);
    const teacherInvite = await issueInvite(institutionIds[0], { role: "teacher", boundPhone: teacher.phone }, actorId, true);
    const studentInvite = await issueInvite(institutionIds[0], { role: "student", maxUses: 2 }, actorId, true);
    await t.test("staff phone binding and fresh verification cannot be bypassed", async () => {
      assert.equal((await request("/api/institutions/join", { code: teacherInvite.code, consent: true }, String(outsider._id))).status, 403);
      assert.equal((await request("/api/institutions/join", { code: teacherInvite.code, consent: true }, String(teacher._id))).status, 400);
      const noPhone = await newUser("no-phone");
      await assert.rejects(joinInstitution(String(noPhone._id), teacherInvite.code));
      const result = await request("/api/institutions/join", { code: teacherInvite.code, consent: true,
        phoneVerificationToken: createPhoneVerificationToken(teacher.phone!, "signup") }, String(teacher._id));
      assert.equal(result.status, 200);
      await joinInstitution(String(manager._id), managerInvite.code);
      assert.equal((await request("/api/teacher/legacy-test", undefined, String(teacher._id))).status, 403);
    });
    await t.test("student grants are independent and cannot be restarted; paid records are preserved", async () => {
      const result = await joinInstitution(String(student._id), studentInvite.code);
      assert.ok(result!.freeStartDate >= (await Institution.findById(institutionIds[0]))!.activatedAt!);
      assert.equal(result!.freeEndDate.toISOString(), threeMonthsAfter(result!.freeStartDate).toISOString());
      assert.equal((await ensureStudentAccountTrial(String(student._id)))!.active, true);
      await assert.rejects(joinInstitution(String(student._id), studentInvite.code));
      const paid = await newUser("paid", "966500000005");
      await User.updateOne({ _id: paid._id }, { $set: { subscription: { type: "Pro", endDate: "2030-01-01T00:00:00Z" } } });
      await joinInstitution(String(paid._id), studentInvite.code);
      assert.equal((await User.findById(paid._id))!.subscription!.endDate, "2030-01-01T00:00:00Z");
      assert.equal(await Subscription.countDocuments({ userId: String(paid._id) }), 0);
      const overflow = await newUser("overflow", "966500000006");
      const extraInvite = await issueInvite(institutionIds[0], { role: "student", maxUses: 1 }, actorId, true);
      await assert.rejects(joinInstitution(String(overflow._id), extraInvite.code), /حد الأعضاء/);
      assert.equal((await InstitutionInvite.findById(extraInvite.invite.id))!.uses, 0);
    });
    await t.test("teacher only sees assigned students; directors cannot issue director codes", async () => {
      assert.equal((await request("/api/institution/dashboard", undefined, String(teacher._id))).body.members.length, 0);
      assert.equal((await request(`/api/institution/students/${student._id}/results`, undefined, String(teacher._id))).status, 404);
      const member = await InstitutionMember.findOne({ userId: student._id });
      assert.equal((await request(`/api/institution/members/${member!._id}/teachers`,
        { teacherIds: [String(teacher._id)] }, String(manager._id))).status, 200);
      assert.equal((await request("/api/institution/dashboard", undefined, String(teacher._id))).body.members.length, 1);
      assert.equal((await request(`/api/institution/students/${outsider._id}/results`, undefined, String(teacher._id))).status, 404);
      assert.equal((await request("/api/institution/invites", { role: "institution_admin", boundPhone: "966500000007" }, String(manager._id))).status, 403);
      assert.equal((await request("/api/institution/dashboard", undefined, String(student._id))).status, 403);
    });
    await t.test("new invited registration derives role, requires verified phone/consent, and is atomic", async () => {
      const invite = await issueInvite(institutionIds[1], { role: "student", maxUses: 1 }, actorId, true);
      const body = { fullName: "طالب اختبار التسجيل", username: `${marker}-registered`,
        email: `${marker}-registered@example.invalid`, phone: "966500000009", password: "fixture-password-only",
        code: invite.code, role: "system_admin", consent: true };
      assert.equal((await request("/api/institutions/register", body)).status, 400);
      const registered = await request("/api/institutions/register", { ...body,
        phoneVerificationToken: createPhoneVerificationToken(body.phone, "signup") });
      assert.equal(registered.status, 201); userIds.push(registered.body.id);
      assert.equal(registered.body.role, "student"); assert.equal(registered.body.password, undefined);
      assert.equal((await membershipForUser(registered.body.id))!.freeActive, true);
      assert.equal((await InstitutionInvite.findById(invite.invite.id))!.uses, 1);
    });
    await t.test("suspension and expiration override stored trial dates, and revocation preserves records", async () => {
      await Institution.updateOne({ _id: institutionIds[0] }, { $set: { isActive: false, suspendedAt: new Date() } });
      assert.equal((await ensureStudentAccountTrial(String(student._id)))!.active, false);
      assert.equal((await request("/api/institution/dashboard", undefined, String(teacher._id))).status, 403);
      await Institution.updateOne({ _id: institutionIds[0] }, { $set: { isActive: true }, $unset: { suspendedAt: "" } });
      await InstitutionMember.updateOne({ userId: student._id }, { $set: { freeEndDate: new Date(0) } });
      assert.equal((await ensureStudentAccountTrial(String(student._id)))!.active, false);
      const member = await InstitutionMember.findOne({ userId: student._id });
      assert.equal((await request(`/api/institution/members/${member!._id}/revoke`, {}, String(manager._id))).status, 200);
      assert.ok(await User.exists({ _id: student._id }));
      assert.equal((await request(`/api/institution/students/${student._id}/results`, undefined, String(teacher._id))).status, 404);
    });
    await t.test("inactive or deleted administrators cannot reuse an institution-management session", async () => {
      await Admin.updateOne({ _id: actorId }, { $set: { isActive: false } });
      assert.equal((await request("/api/admin/institutions", undefined, undefined, true)).status, 403);
      await Admin.deleteOne({ _id: actorId });
      assert.equal((await request("/api/admin/institutions", undefined, undefined, true)).status, 403);
    });
  } finally {
    await Admin.deleteOne({ _id: actorId });
    globalThis.fetch = originalFetch;
    await InstitutionMember.deleteMany({ institutionId: { $in: institutionIds } });
    await InstitutionInvite.deleteMany({ institutionId: { $in: institutionIds } });
    await User.deleteMany({ $or: [{ _id: { $in: userIds } }, { username: { $regex: `^${marker}` } }] });
    await TestResult.deleteMany({ userId: { $in: userIds } });
    await Institution.deleteMany({ _id: { $in: institutionIds } });
    await new Promise<void>(resolve => server.close(() => resolve()));
    await mongoose.disconnect();
    for (const [key, value] of originalEnv) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
