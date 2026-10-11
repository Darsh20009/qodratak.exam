// Read-only inventory: no student data, credentials, database writes or AI calls.
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
const staging = JSON.parse(await fs.readFile(new URL('../attached_assets/verbal-forms-import.json', import.meta.url), 'utf8'));
const sourceId = (q) => q.source?.formIndex && q.source?.questionId
  ? `${q.source.formIndex}:${q.source.questionId}` : null;
const staged = new Map(staging.map((q) => [sourceId(q), q]).filter(([id]) => id));
if (!process.env.MONGODB_URI) throw new Error('Database configuration is missing');
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const questions = await mongoose.connection.db.collection('questions')
    .find({ category: 'verbal' }, { projection: {
      _id: 1, questionId: 1, text: 1, options: 1, correctOptionIndex: 1,
      answerStatus: 1, source: 1, subcategory: 1, explanation: 1,
    } }).toArray();
  const findings = [];
  const ids = new Map();
  const signatures = new Map();
  let matched = 0;
  const statuses = {};
  for (const q of questions) {
    statuses[q.answerStatus || 'missing'] = (statuses[q.answerStatus || 'missing'] || 0) + 1;
    const add = (issue) => findings.push({ questionId: q.questionId, databaseId: String(q._id),
      sourceId: sourceId(q), issue, text: q.text, options: q.options, key: q.correctOptionIndex });
    const options = Array.isArray(q.options) ? q.options : [];
    if (!Number.isInteger(q.correctOptionIndex) || q.correctOptionIndex < 0 || q.correctOptionIndex >= options.length) add('invalid_answer_key');
    if (options.length < 2 || options.some((o) => typeof o !== 'string' || !o.trim())) add('missing_options');
    if (new Set(options.map((o) => String(o).trim())).size !== options.length) add('duplicate_options');
    if (!q.text?.trim()) add('missing_question_text');
    if (/استيعاب|مقروء|قطعة/.test(q.subcategory || '') && !q.source?.passageText?.trim()) add('reading_without_passage');
    const imported = staged.get(sourceId(q));
    if (imported) {
      matched++;
      if (JSON.stringify(options) !== JSON.stringify(imported.options)) add('options_differ_from_staging');
      if (q.correctOptionIndex !== imported.correctOptionIndex) add('key_differs_from_staging');
    }
    if (ids.has(q.questionId)) add('duplicate_numeric_question_id');
    ids.set(q.questionId, q);
    const signature = JSON.stringify([q.text?.trim(), options, /استيعاب|مقروء|قطعة/.test(q.subcategory || '') ? q.source?.passageText : '']);
    const previous = signatures.get(signature);
    if (previous && previous.correctOptionIndex !== q.correctOptionIndex) add('identical_question_conflicting_key');
    signatures.set(signature, q);
  }
  const issues = {};
  const otherQuestions = await mongoose.connection.db.collection('questions')
    .find({ category: { $ne: 'verbal' } }, { projection: {
      questionId: 1, category: 1, options: 1, correctOptionIndex: 1, answerStatus: 1,
    } }).toArray();
  const otherBankStructure = { total: otherQuestions.length, byCategory: {}, statuses: {},
    invalidApprovedKeys: 0, invalidApprovedOptions: 0, duplicateNumericIdsAcrossBank: 0 };
  for (const q of otherQuestions) {
    const category = q.category || 'missing';
    otherBankStructure.byCategory[category] = (otherBankStructure.byCategory[category] || 0) + 1;
    const status = q.answerStatus || 'missing';
    otherBankStructure.statuses[status] = (otherBankStructure.statuses[status] || 0) + 1;
    const options = Array.isArray(q.options) ? q.options : [];
    if (q.answerStatus === 'approved') {
      if (!Number.isInteger(q.correctOptionIndex) || q.correctOptionIndex < 0 || q.correctOptionIndex >= options.length) otherBankStructure.invalidApprovedKeys++;
      if (options.length < 2 || options.some((o) => typeof o !== 'string' || !o.trim()) ||
          new Set(options.map((o) => String(o).trim())).size !== options.length) otherBankStructure.invalidApprovedOptions++;
    }
    if (ids.has(q.questionId)) otherBankStructure.duplicateNumericIdsAcrossBank++;
    ids.set(q.questionId, q);
  }
  let liveSourceCheck;
  if (process.argv.includes('--source-check')) {
    const urls = [...new Set(questions.map((q) => q.source?.url).filter(Boolean))];
    const normalize = (text) => String(text ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim();
    liveSourceCheck = { forms: urls.length, checked: 0, matchedQuestionTextAndOptions: 0, unavailableForms: 0 };
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(3, urls.length) }, async () => {
      while (cursor < urls.length) {
        const url = urls[cursor++];
        let items;
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
          const html = await response.text();
          const match = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(\[.*\]);/s);
          if (!response.ok || !match) throw new Error('Source not accessible');
          items = new Map(JSON.parse(match[1])[1][1].map((item) => [String(item[0]), item]));
        } catch {
          liveSourceCheck.unavailableForms++;
          continue;
        }
        for (const q of questions.filter((item) => item.source?.url === url)) {
          liveSourceCheck.checked++;
          const item = items.get(String(q.source.questionId));
          const options = item?.[4]?.[0]?.[1]?.map((option) => normalize(option[0]));
          if (item && normalize(item[1]) === normalize(q.text) &&
              JSON.stringify(options) === JSON.stringify(q.options.map(normalize))) {
            liveSourceCheck.matchedQuestionTextAndOptions++;
          } else {
            findings.push({ questionId: q.questionId, databaseId: String(q._id),
              sourceId: sourceId(q), issue: 'live_source_text_or_options_need_review',
              text: q.text, options: q.options, key: q.correctOptionIndex });
          }
        }
      }
    }));
  }
  for (const finding of findings) issues[finding.issue] = (issues[finding.issue] || 0) + 1;
  const report = {
    checkedAt: new Date().toISOString(), databaseQuestions: questions.length,
    stagingQuestions: staging.length, matchedToStaging: matched, statuses, issues, liveSourceCheck, otherBankStructure,
    contentVerification: 'Structural comparison only. Staging/AI solutions are not an independent reviewed answer key; linguistic correctness is not certified.',
    findings,
  };
  await fs.mkdir('generated-artifacts/verbal-audit', { recursive: true });
  await fs.writeFile('generated-artifacts/verbal-audit/question-audit.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, findings: undefined }, null, 2));
} finally { await mongoose.disconnect(); }
