import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

async function main() {
  const sourceId = process.env.TAHSILI_SOURCE_FILTER?.trim();
  const pageStart = Number(process.env.TAHSILI_PAGE_START);
  const pageEnd = Number(process.env.TAHSILI_PAGE_END);
  if (!sourceId || !Number.isInteger(pageStart) || !Number.isInteger(pageEnd) || pageStart < 1 || pageEnd < pageStart) {
    throw new Error("Set TAHSILI_SOURCE_FILTER, TAHSILI_PAGE_START, and TAHSILI_PAGE_END.");
  }
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Read-only export is restricted to preview database test.");
  const rows = await TahsiliQuestionDraft.find({
    sourceId,
    status: "pending_review",
    sourcePage: { $gte: pageStart, $lte: pageEnd },
  })
    .select("_id sourceKey sourceOrdinal questionId subject subcategory text options sourcePage sourceQuestionNumber sourceBlockIndex sourceImageObjectKey requiresImage sourceBook difficulty topic")
    .sort({ sourcePage: 1, sourceBlockIndex: 1 })
    .lean() as any[];
  console.log(JSON.stringify({
    database: TahsiliQuestionDraft.db.name,
    sourceId,
    pageStart,
    pageEnd,
    count: rows.length,
    rows: rows.map((row) => ({
      id: String(row._id),
      sourceKey: row.sourceKey,
      page: row.sourcePage,
      block: row.sourceBlockIndex,
      sourceQuestionNumber: row.sourceQuestionNumber ?? null,
      questionId: row.questionId,
      subject: row.subject,
      text: row.text,
      options: row.options,
      requiresImage: Boolean(row.requiresImage),
      imageObjectKey: row.sourceImageObjectKey || null,
      sourceBook: row.sourceBook,
      difficulty: row.difficulty,
      topic: row.topic,
    })),
  }, null, 2));
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : "Export failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
