import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40eda", page: 119, number: 1, topic: "قوانين مندل", text: "ظهرت بذور صفراء هجينة في الجيل الأول من تلقيح نباتي بازلاء. ما التفسير الوراثي؟", options: ["كان كلا الأبوين أصفر هجينًا", "كان أحد الأبوين فقط أصفر هجينًا", "صفة اللون الأصفر متنحية", "صفة اللون الأصفر سائدة على اللون الأخضر"], answer: 3, explanation: "ظهور الصفة الصفراء في أفراد الجيل الأول الهجينة يدل على أن أليل اللون الأصفر سائد على أليل اللون الأخضر." },
  { id: "6ad0103163cd9c24f9f40edb", page: 119, number: 2, topic: "التنوع الوراثي", text: "أي عملية لا تزيد التنوع الوراثي للأمشاج؟", options: ["الانقسام المتساوي", "التوزيع العشوائي للكروموسومات", "العبور الجيني", "الانقسام المنصف"], answer: 0, explanation: "الانقسام المتساوي ينتج خلايا متقاربة وراثيًا، بينما يسهم العبور والتوزيع العشوائي في التنوع الوراثي للأمشاج." },
  { id: "6ad0103163cd9c24f9f40edc", page: 119, number: 3, topic: "قوانين مندل", text: "أي طراز جيني يعبّر عن صفتين متنحيتين متماثلتي الجينات؟", options: ["SSRR", "ssRr", "ssrr", "SSRr"], answer: 2, explanation: "لظهور الصفتين المتنحيتين يجب أن يكون الفرد متماثل الجينات متنحيًا في الموضعين: ssrr." },
  { id: "6ad0103163cd9c24f9f40edd", page: 119, number: 4, topic: "قوانين مندل", text: "عند تلقيح نباتين هجينين لصفة لون الأزهار، ظهر في النسل ثلاثة نباتات حمراء مقابل نبات أبيض واحد. ما الطراز الجيني المرجح للأبوين؟", options: ["Rr × Rr", "RR × RR", "RR × rr", "rr × rr"], answer: 0, explanation: "ينتج التزاوج Rr × Rr نسبة جينية 1 RR : 2 Rr : 1 rr، ونسبة مظهرية 3 سائدة إلى 1 متنحية عند سيادة الأحمر." },
  { id: "6ad0103163cd9c24f9f40ede", page: 119, number: 5, topic: "الكروموسومات", text: "ما الوظيفة الرئيسة للتيلوميرات الموجودة عند نهايات الكروموسومات؟", options: ["حماية نهايات الكروموسومات من التلف والالتحام غير المناسب", "تكوين جزيئات tRNA", "إعادة وصل شريطي DNA بعد تضاعفهما", "تثبيت خيوط المغزل عند السنترومير"], answer: 0, explanation: "التيلوميرات تراكيب متكررة عند نهايات الكروموسومات، تساعد على حماية النهايات من التدهور أو الالتحام غير المناسب أثناء تضاعف DNA." },
  { id: "6ad0103163cd9c24f9f40edf", page: 119, number: 6, topic: "الكروموسومات", text: "ما فائدة التيلوميرات في DNA الكروموسومات؟", options: ["تساعد على ثبات الكروموسوم وحماية نهاياته", "إنتاج الطاقة", "ترتيب القواعد النيتروجينية", "نقل المعلومات الوراثية وحدها"], answer: 0, explanation: "توجد التيلوميرات عند أطراف الكروموسومات، وتحد من تلف تلك الأطراف وتحافظ على استقرارها." },
  { id: "6ad0103163cd9c24f9f40ee0", page: 119, number: 8, topic: "قوانين مندل", text: "في ذبابة الفاكهة، صفة الظهر الأحمر R سائدة على الأسود r. ما النسبة المظهرية عند تلقيح ذكر أسود rr بأنثى حمراء غير متماثلة Rr؟", options: ["1 أحمر : 1 أسود", "1 أحمر : 2 أسود", "2 أحمر : 1 أسود", "3 أحمر : 1 أسود"], answer: 0, explanation: "ينتج التزاوج Rr × rr نسلًا نصفه Rr أحمر ونصفه rr أسود؛ لذلك النسبة 1:1." },
  { id: "6ad0103163cd9c24f9f40ee1", page: 119, number: 9, topic: "قوانين مندل", text: "ظهرت آذان طويلة في جميع أفراد الجيل الأول من تزاوج سنجاب طويل الأذن مع سنجاب قصير الأذن، ثم ظهرت نسبة 3 طويل إلى 1 قصير في الجيل التالي. ما الصفة السائدة؟", options: ["الأذن الطويلة", "الأذن القصيرة", "كلتا الصفتين متساويتان", "لا يمكن استنتاج السيادة"], answer: 0, explanation: "ظهور صفة الأذن الطويلة في كل أفراد الجيل الأول ثم بنسبة 3:1 في الجيل الثاني يدل على أنها الصفة السائدة." },
  { id: "6ad0103163cd9c24f9f40ee2", page: 119, number: 10, topic: "قوانين مندل", text: "ما اسم الصفات الظاهرة الناتجة من أزواج الجينات المتقابلة؟", options: ["الطرز الجينية", "الطرز الشكلية", "الجينات المتماثلة", "الجينات غير المتماثلة"], answer: 1, explanation: "الطراز الشكلي هو الصفات التي يمكن ملاحظتها، أما الطراز الجيني فهو تركيب الأليلات." },
  { id: "6ad0103163cd9c24f9f40ee3", page: 120, number: 11, topic: "قوانين مندل", text: "في جدول يصف نسل تلقيح نبات أحمر طويل الساق متماثل الجينات (RRTT) بنبات أبيض قصير الساق (rrtt)، أي طراز جيني متوقع لأفراد الجيل الأول؟", options: ["RrTT", "RRTT", "RrTt", "Rrtt"], answer: 2, explanation: "ينتج الأب RRTT أمشاجًا من النوع RT، وينتج الأب rrtt أمشاجًا من النوع rt؛ لذلك يكون النسل كله RrTt." },
  { id: "6ad0103163cd9c24f9f40ee4", page: 120, number: 12, topic: "قوانين مندل", text: "إذا لُقّح أرنب أبيض طويل الأذنين متماثل الجينات (WWTT) بأرنب أسود قصير الأذنين (wwtt)، فما الطراز الجيني المتوقع للجيل الأول؟", options: ["WWTT", "wwtt", "WwTt", "Wwtt"], answer: 2, explanation: "كل نسل التزاوج WWTT × wwtt يستقبل W وT من الأول وw وt من الثاني، فيكون طرازه الجيني WwTt." },
  { id: "6ad0103163cd9c24f9f40ee5", page: 120, number: 13, topic: "قوانين مندل", text: "في مربع بانيت لتهجين YyRr × YyRr، حيث الأصفر Y والمستدير R صفتان سائدتان، ما المظهر المتوقع للفرد ذي الطراز yyrr؟", options: ["أصفر مستدير", "أصفر مجعد", "أخضر مستدير", "أخضر مجعد"], answer: 3, explanation: "يحمل yy أليلين متنحيين للون الأخضر، ويحمل rr أليلين متنحيين للبذور المجعدة؛ لذلك يكون المظهر أخضر مجعدًا." },
  { id: "6ad0103163cd9c24f9f40ee6", page: 120, number: 14, topic: "قوانين مندل", text: "إذا كان كلا الوالدين يستطيع ثني اللسان وكان طرازهما الجيني غير متماثل Tt، فما الطرز الجينية الممكنة للأبناء؟", options: ["tt فقط", "TT فقط", "TT وtt فقط", "TT وTt وtt"], answer: 3, explanation: "ينتج التزاوج Tt × Tt الأنماط الجينية TT وTt وtt بنسبة 1:2:1." },
  { id: "6ad0103163cd9c24f9f40ee7", page: 120, number: 15, topic: "قوانين مندل", text: "وفق قانون السيادة في تهجين سلالتين نقيتين مختلفتين في صفة واحدة، ما الصفة التي تظهر عادة في أفراد الجيل الأول؟", options: ["الصفة السائدة", "صفة مرتبطة بالجنس", "صفة متأثرة بالجنس", "الصفة المتنحية"], answer: 0, explanation: "عند تهجين فردين نقيين مختلفين في صفة مندلية، تظهر الصفة السائدة في أفراد الجيل الأول الهجين." },
  { id: "6ad0103163cd9c24f9f40ee8", page: 120, number: 16, topic: "الوراثة - تعدد الأليلات", text: "إلى أي نمط وراثي ينتمي نظام فصائل الدم ABO؟", options: ["السيادة غير التامة", "تفوق الجينات", "الصفات المتأثرة بالجنس", "تعدد الأليلات"], answer: 3, explanation: "تتحكم في نظام ABO ثلاثة أليلات شائعة هي IA وIB وi؛ لذلك يعد مثالًا على تعدد الأليلات، مع سيادة مشتركة بين IA وIB." },
  { id: "6ad0103163cd9c24f9f40ee9", page: 120, number: 17, topic: "قوانين مندل", text: "حصان أسود غير متماثل الجينات Rr تزاوج مع حصان أشقر rr. ما النسبة المتوقعة للأبناء؟", options: ["1 أشقر : 1 أسود", "1 أشقر : 3 أسود", "2 أشقر : 1 أسود", "2 أشقر : 3 أسود"], answer: 0, explanation: "ينتج Rr أمشاج R وr، بينما ينتج rr أمشاج r فقط؛ فيكون نصف النسل Rr أسود ونصفه rr أشقر." },
  { id: "6ad0103163cd9c24f9f40eea", page: 120, number: 18, topic: "قوانين مندل", text: "عند تزاوج قط مجعد الأذنين مع قطة غير مجعدة، كان جميع الجيل الأول غير مجعد. وعند تزاوج أفراد الجيل الأول ظهرت نسبة 3 غير مجعد إلى 1 مجعد. ما صفة الأذن المجعدة؟", options: ["سائدة", "متنحية", "سيادة مشتركة", "نادرة بالضرورة"], answer: 1, explanation: "نسبة 3:1 بعد تزاوج أفراد الجيل الأول تتفق مع صفة سائدة وأخرى متنحية؛ وبما أن الصفة الظاهرة في الجيل الأول غير المجعدة، فالتجعد متنحٍ." },
  { id: "6ad0103163cd9c24f9f40eeb", page: 120, number: 19, topic: "قوانين مندل", text: "في تهجين ثنائي، اللون الفاتح B سائد على الغامق b، واستدارة البذور R سائدة على التجعد r. ما المظهر الجيني للفرد ذي الطراز bbrr في مربع بانيت؟", options: ["فاتح مستدير", "فاتح مجعد", "غامق مجعد", "غامق مستدير"], answer: 2, explanation: "الطراز bb متنحٍ للون الغامق، والطراز rr متنحٍ لشكل البذرة المجعد؛ لذا يكون المظهر غامقًا مجعدًا." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const ids = approvals.map((item) => item.id);
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: ids }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceBlockIndex sourceBook topic difficulty status")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== ids.length) failures.push(`expected ${ids.length} source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "approved"].includes(draft.status)) failures.push(`q${item.number} p${item.page}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.options.some((option) => !option.trim()) || item.answer < 0 || item.answer > 3) failures.push(`q${item.number} p${item.page}: invalid cleaned options/key`);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("text correctOptionIndex").lean() as any : null;
    if (draft?.status === "approved" && (!published || published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number} p${item.page}: approved draft does not match its published record`);
    if (published && (published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number} p${item.page}: published record conflicts with this review`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approvals.length, rejected: 0, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.findOneAndUpdate({ sourceKey: draft.sourceKey }, { $set: {
      questionId: draft.questionId, sourceId: draft.sourceId, sourceKey: draft.sourceKey, sourceOrdinal: draft.sourceOrdinal,
      subject: "أحياء", subcategory: item.topic, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.topic, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject: "أحياء", subcategory: item.topic, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة مفتاح الإجابة والشرح مع المصدر، وتنقيح صياغة السؤال أو الخيارات عند الحاجة.", updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
