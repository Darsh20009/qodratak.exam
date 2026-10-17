import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const sourceId = "yelo-2024-p2-thursday-evening";
const corrections = [
  { id: "6ad0150c63cd9c24f9f41952", page: 65, draftFrom: "مختلط", publishedFrom: "كيمياء", to: "أحياء", label: "ethylene ripening hormone" },
  { id: "6ad0150c63cd9c24f9f41958", page: 67, draftFrom: "مختلط", publishedFrom: "كيمياء", to: "فيزياء", label: "specific heat" },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const drafts = await TahsiliQuestionDraft.find({
    _id: { $in: corrections.map((item) => item.id) },
    sourceId,
    status: "approved",
  }).select("_id sourceKey sourcePage subject").lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures = [];
  const publishedById = new Map<string, any>();
  for (const item of corrections) {
    const draft = byId.get(item.id);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("subject").lean() as any : null;
    if (published) publishedById.set(item.id, published);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey ||
      ![item.draftFrom, item.to].includes(draft.subject)) failures.push(`${item.label}: unexpected draft state ${JSON.stringify(draft ?? null)}`);
    if (!published || ![item.publishedFrom, item.to].includes(published.subject)) failures.push(`${item.label}: unexpected published state ${JSON.stringify(published ?? null)}`);
  }
  if (failures.length) throw new Error(JSON.stringify({ failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, checked: corrections.length, corrections, changed: false };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  for (const item of corrections) {
    const draft = byId.get(item.id)!;
    if (publishedById.get(item.id)?.subject !== item.to) {
      const result = await TahsiliQuestion.updateOne(
        { sourceKey: draft.sourceKey, subject: item.publishedFrom },
        { $set: { subject: item.to, subcategory: item.to, updatedAt: new Date() } },
      );
      if (result.modifiedCount !== 1) throw new Error(`Failed to update published category for ${item.label}.`);
    }
    if (draft.subject !== item.to) {
      const result = await TahsiliQuestionDraft.updateOne(
        { _id: draft._id, sourceId, sourcePage: item.page, status: "approved", subject: item.draftFrom },
        { $set: { subject: item.to, updatedAt: new Date() } },
      );
      if (result.modifiedCount !== 1) throw new Error(`Failed to update review category for ${item.label}.`);
    }
  }
  summary.changed = true;
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : "Correction failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
