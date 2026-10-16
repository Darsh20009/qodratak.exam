import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const REVIEWER = "source-quality-quarantine";
const figureReference =
  /(?:الشكل|الرسم|المخطط|الجدول).{0,24}(?:المجاور|المقابل|الآتي|التالي)|(?:من|في)\s+(?:الشكل|الرسم)\s+(?:المجاور|المقابل)/u;
const invalidControlCharacter = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/u;

function rejectionReason(draft: any): string | null {
  const text = typeof draft.text === "string" ? draft.text : "";
  const options = Array.isArray(draft.options) ? draft.options.filter((value: unknown) => typeof value === "string").join(" ") : "";
  const missingReferencedFigure = !draft.sourceImageObjectKey && figureReference.test(text);
  const corruptedText = invalidControlCharacter.test(`${text} ${options}`);
  if (!missingReferencedFigure && !corruptedText) return null;
  const reasons: string[] = [];
  if (missingReferencedFigure) reasons.push("السؤال يعتمد على شكل/رسم/جدول مذكور في النص، لكن لا توجد صورة مصدر مرتبطة به");
  if (corruptedText) reasons.push("النص أو أحد الخيارات يحتوي محارف تحكم/استبدال غير صالحة ناتجة عن تلف الاستخراج");
  return `مستبعد مؤقتًا من بنك الطلاب مع إبقاء المسودة محفوظة: ${reasons.join("؛ ")}. يمكن إعادته بعد إرفاق المصدر أو تصحيح الاستخراج ومراجعته.`;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const connected = await connectToMongoDB();
  if (!connected) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") {
    throw new Error(`Refusing database "${TahsiliQuestionDraft.db.name}"; this quarantine is authorized for Replit preview only.`);
  }

  const drafts = await TahsiliQuestionDraft.find({ status: "pending_review" })
    .select("_id sourceKey sourceId sourceQuestionNumber sourcePage text options sourceImageObjectKey status")
    .lean() as any[];
  const candidates = drafts.flatMap((draft) => {
    const note = rejectionReason(draft);
    return note ? [{ draft, note }] : [];
  });
  const sourceCounts: Record<string, number> = {};
  const reasons = { missingReferencedFigure: 0, corruptedText: 0 };
  for (const { draft } of candidates) {
    sourceCounts[draft.sourceId || "(missing)"] = (sourceCounts[draft.sourceId || "(missing)"] || 0) + 1;
    const text = `${draft.text || ""} ${(draft.options || []).join(" ")}`;
    if (!draft.sourceImageObjectKey && figureReference.test(draft.text || "")) reasons.missingReferencedFigure += 1;
    if (invalidControlCharacter.test(text)) reasons.corruptedText += 1;
  }
  const sourceKeys = candidates.map(({ draft }) => draft.sourceKey).filter(Boolean);
  const publishedMatches = sourceKeys.length
    ? await TahsiliQuestion.find({ sourceKey: { $in: sourceKeys } }).select("sourceKey").lean()
    : [];
  if (publishedMatches.length) throw new Error(`Found ${publishedMatches.length} already-published matches; refusing to quarantine.`);

  const summary = {
    mode: apply ? "apply" : "dry-run",
    database: TahsiliQuestionDraft.db.name,
    pendingDraftsScanned: drafts.length,
    candidates: candidates.length,
    reasons,
    bySource: sourceCounts,
    examples: candidates.slice(0, 12).map(({ draft, note }) => ({
      sourceId: draft.sourceId,
      sourcePage: draft.sourcePage,
      sourceQuestionNumber: draft.sourceQuestionNumber,
      text: String(draft.text || "").slice(0, 120),
      note,
    })),
    changed: false,
  };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const reviewedAt = new Date();
  let changed = 0;
  for (const { draft, note } of candidates) {
    const result = await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, status: "pending_review" },
      { $set: { status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: note, updatedAt: reviewedAt } },
    );
    changed += result.modifiedCount || 0;
  }
  if (changed !== candidates.length) {
    throw new Error(`Expected to quarantine ${candidates.length} drafts, but changed ${changed}. Check for concurrent edits.`);
  }
  summary.changed = true;
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Quarantine failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromMongoDB();
  });
