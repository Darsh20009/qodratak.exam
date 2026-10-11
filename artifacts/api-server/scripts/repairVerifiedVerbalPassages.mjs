// Two exact source-evidenced repairs only. Never changes historical student results.
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
const staging = JSON.parse(await fs.readFile(new URL('../attached_assets/verbal-forms-import.json', import.meta.url), 'utf8'));
const ids = ['1284006712', '619363437'];
const sourceUrl = staging.find((q) => q.stagingId === 'form15-q1284006712').source.url;
const html = await (await fetch(sourceUrl)).text();
const match = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*\]);/s);
if (!match) throw new Error('Authoritative source form is unavailable');
const items = JSON.parse(match[1])[1][1];
const changes = [];
for (const id of ids) {
  const q = staging.find((q) => q.stagingId === `form15-q${id}`);
  const index = items.findIndex((item) => String(item[0]) === id);
  const paragraph = items[index - 1];
  if (index < 1 || paragraph[3] !== 6 || paragraph[2] !== q.source.passageText ||
      items[index][1] !== q.text) throw new Error('Source identity or passage does not match the reviewed repair');
  if (id === '619363437' && (42 / 12 !== 3.5 || q.options[q.correctOptionIndex] !== '3.5 مليار دولار')) {
    throw new Error('Verified annual-to-monthly calculation does not match the key');
  }
  changes.push(q);
}
if (!process.env.MONGODB_URI) throw new Error('Database configuration is missing');
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const collection = mongoose.connection.db.collection('questions');
  const before = await collection.find({ 'source.formIndex': 15, 'source.questionId': { $in: ids } },
    { projection: { _id: 1, questionId: 1, options: 1, correctOptionIndex: 1, subcategory: 1, source: 1, explanation: 1, studentTip: 1 } }).toArray();
  if (before.length !== 2) throw new Error('Expected exactly the two source questions');
  await fs.mkdir('generated-artifacts/verbal-audit', { recursive: true });
  await fs.writeFile('generated-artifacts/verbal-audit/source-repair-evidence.json',
    JSON.stringify({ sourceUrl, before, verifiedCalculation: '42 / 12 = 3.5', historicalResultsChanged: false }, null, 2));
  for (const q of changes) {
    const old = before.find((item) => item.source.questionId === q.source.questionId);
    if (JSON.stringify(old.options) !== JSON.stringify(q.options)) throw new Error('Options changed: refusing key remapping');
    const result = await collection.updateOne({
      _id: old._id, correctOptionIndex: old.correctOptionIndex,
      options: old.options, 'source.questionId': q.source.questionId,
    }, { $set: {
      correctOptionIndex: q.correctOptionIndex, subcategory: q.subcategory,
      'source.subcategory': q.source.subcategory, 'source.passageText': q.source.passageText,
      'source.passageLabel': q.source.passageLabel, explanation: q.explanation,
      studentTip: q.studentTip, updatedAt: new Date(),
    } });
    if (result.matchedCount !== 1) throw new Error('Concurrent source update: repair stopped');
    console.log(JSON.stringify({ sourceQuestionId: q.source.questionId, matched: result.matchedCount, modified: result.modifiedCount }));
  }
  const corrected = before.find((q) => q.source.questionId === '619363437');
  console.log(JSON.stringify({
    historicalLearningAttemptsNeedingReview: await mongoose.connection.db.collection('learningattempts')
      .countDocuments({ questionId: String(corrected._id) }),
    historicalResultsChanged: false,
  }));
} finally { await mongoose.disconnect(); }
