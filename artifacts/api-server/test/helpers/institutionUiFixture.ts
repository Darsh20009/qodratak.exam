import fs from "node:fs/promises";
import crypto from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Admin, Institution, User, TestResult } from "../../src/mongodb/models";
import { InstitutionMember, InstitutionInvite } from "../../src/mongodb/institutionModels";
import { createPhoneVerificationToken } from "../../src/services/phoneOtpService";
import { writeR2Object } from "../../src/services/qudratVerbalBookFilesService";
import { ensureStudentAccountTrial, enforceStudentTrialAccess } from "../../src/middleware/studentTrialAccess";

const file = "/tmp/qodratak-institutions-ui-fixture.json";
if (process.env.NODE_ENV === "production") throw new Error("UI fixtures are development-only");
await mongoose.connect(process.env.MONGODB_URI!);
try {
  if (process.argv.includes("--shorten-signup")) {
    const fixture = JSON.parse(await fs.readFile(file, "utf8"));
    if (!fixture.marker.startsWith("institution-ui-")) throw new Error("Invalid fixture");
    if (await User.exists({ username: fixture.newStudent.username })) throw new Error("Signup already completed");
    fixture.newStudent.username = `qaui${crypto.randomBytes(5).toString("hex")}`;
    await fs.writeFile(file, JSON.stringify(fixture), { mode: 0o600 });
    console.log("Synthetic signup username shortened to match normal form limits.");
  } else if (process.argv.includes("--refresh")) {
    const fixture = JSON.parse(await fs.readFile(file, "utf8"));
    if (!fixture.marker.startsWith("institution-ui-")) throw new Error("Invalid fixture");
    for (const actor of [fixture.director, fixture.teacher, fixture.newStudent]) {
      actor.verificationToken = createPhoneVerificationToken(actor.phone, "signup");
    }
    await fs.writeFile(file, JSON.stringify(fixture), { mode: 0o600 });
    console.log("Synthetic verification tokens refreshed; no message sent.");
  } else if (process.argv.includes("--validate-staff-expiry")) {
    const fixture = JSON.parse(await fs.readFile(file, "utf8"));
    const member = await InstitutionMember.findOne({ userId: fixture.teacher.id });
    if (!member || !fixture.marker.startsWith("institution-ui-")) throw new Error("Teacher fixture membership unavailable");
    const originalEnd = member.freeEndDate;
    try {
      await InstitutionMember.updateOne({ _id: member._id }, { $set: { freeEndDate: new Date(0) } });
      const access = await ensureStudentAccountTrial(fixture.teacher.id);
      if (access?.active) throw new Error("Expired staff learning was granted");
      let status = 0;
      let continued = false;
      const request: any = { session: { userId: fixture.teacher.id, userRole: "teacher" },
        baseUrl: "", path: "/api/foundation/lessons", method: "GET", log: { error() {} } };
      const response: any = { status(code: number) { status = code; return this; }, json() {} };
      await enforceStudentTrialAccess(request, response, () => { continued = true; });
      if (status !== 402 || continued) throw new Error("Expired staff learning did not close");
      status = 0; continued = false; request.path = "/api/institution/dashboard";
      await enforceStudentTrialAccess(request, response, () => { continued = true; });
      if (!continued || status) throw new Error("Institution management closed with learning grant");
      console.log("Staff learning expires correctly; scoped management remains available.");
    } finally { await InstitutionMember.updateOne({ _id: member._id }, { $set: { freeEndDate: originalEnd } }); }
  } else if (process.argv.includes("--seed-results")) {
    const fixture = JSON.parse(await fs.readFile(file, "utf8"));
    const user = await User.findOne({ username: fixture.newStudent.username, email: fixture.newStudent.email });
    if (!user || !fixture.marker.startsWith("institution-ui-")) throw new Error("Fixture ownership check failed");
    await User.updateOne({ _id: user._id }, { $set: { notifWhatsApp: false, notifEmail: false, notifWeeklyReport: false } });
    const testName = `${fixture.marker} — نتيجة تجريبية غير حقيقية`;
    if (!await TestResult.exists({ userId: String(user._id), testName })) {
      await TestResult.create([0, 1, 2].map(i => ({
        userId: String(user._id), program: "qudrat", testType: i === 1 ? "quantitative" : "verbal",
        testName, difficulty: "beginner", score: 15, totalQuestions: 20, correctAnswers: 15,
        wrongAnswers: 5, skippedQuestions: 0, percentage: 75, timeTaken: 600,
        pointsEarned: 0, isOfficial: false, completedAt: new Date(Date.now() - i * 86400000),
        weakAreas: ["تدريب تجريبي"], strongAreas: ["أداء مرصود تجريبي"],
      })));
    }
    console.log("Three notification-disabled synthetic results prepared.");
  } else if (process.argv.includes("--cleanup")) {
    const fixture = JSON.parse(await fs.readFile(file, "utf8"));
    if (!/^institution-ui-[a-f0-9-]+$/.test(fixture.marker)) throw new Error("Invalid fixture");
    const admin = await Admin.findOne({ _id: fixture.admin.id, username: fixture.admin.username });
    if (!admin) throw new Error("Fixture ownership check failed");
    const institutions = await Institution.find({ "contract.issuedBy": fixture.admin.id });
    const users = await User.find({ email: { $regex: `^${fixture.marker}-.*@example\\.invalid$` } });
    const ids = users.map(u => String(u._id));
    for (const institution of institutions) {
      const key = institution.contract?.signedObjectKey;
      if (key) {
        try { await writeR2Object(key); }
        catch { throw new Error("Fixture ciphertext cleanup failed; do not discard its metadata."); }
      }
      await InstitutionInvite.deleteMany({ institutionId: institution._id });
      await InstitutionMember.deleteMany({ institutionId: institution._id, userId: { $in: ids } });
      await Institution.deleteOne({ _id: institution._id });
    }
    await TestResult.deleteMany({ userId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    await Admin.deleteOne({ _id: admin._id, username: fixture.admin.username });
    await fs.unlink(file);
    console.log("Institutional browser fixtures and encrypted test PDFs removed.");
  } else {
    const marker = `institution-ui-${crypto.randomUUID()}`;
    const password = `Fixture!${crypto.randomBytes(18).toString("base64url")}`;
    const hash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      username: `${marker}-admin`, password: hash, email: `${marker}-admin@example.invalid`,
      fullName: "مدير اختبار غير حقيقي", role: "super_admin", permissions: ["all"], isActive: true,
    });
    const actor = async (label: string, create: boolean) => {
      let phone = "";
      do { phone = `9665${crypto.randomInt(10000000, 99999999)}`; }
      while (await User.exists({ phone }));
      const data = { username: `${marker}-${label}`, email: `${marker}-${label}@example.invalid`,
        fullName: `حساب اختبار ${label}`, phone, password };
      const user = create ? await User.create({
        ...data, password: hash, role: "student", isActive: true, isVerified: true,
        emailVerified: true, notifWhatsApp: false, notifEmail: false, notifWeeklyReport: false,
        trialUsed: true, trialStartDate: new Date(0), trialEndDate: new Date(0),
        subscription: { type: "free", status: "expired", startDate: new Date(0).toISOString(), endDate: new Date(0).toISOString() },
      }) : null;
      return { ...data, id: user ? String(user._id) : undefined,
        verificationToken: createPhoneVerificationToken(phone, "signup") };
    };
    const director = await actor("director", true);
    const teacher = await actor("teacher", true);
    const newStudent = await actor("new-student", false);
    const outsider = await actor("outsider", true);
    await fs.writeFile(file, JSON.stringify({
      marker, admin: { id: String(admin._id), username: admin.username, password },
      director, teacher, newStudent, outsider,
      institution: { name: `مؤسسة اختبار واجهة غير حقيقية ${marker}`,
        email: `${marker}-institution@example.invalid`, city: "الرياض",
        issuerName: "مفوض اختبار غير حقيقي", maxStudents: 8, maxTeachers: 3 },
    }), { mode: 0o600 });
    console.log("Private institutional UI fixture prepared; no credentials logged.");
  }
} finally { await mongoose.disconnect(); }
