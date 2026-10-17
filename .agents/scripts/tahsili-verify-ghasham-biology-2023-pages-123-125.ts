import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40efb", page: 123, number: 1, topic: "الوراثة - الاختلالات الكروموسومية", text: "ما الطراز الكروموسومي الشائع لمتلازمة تيرنر؟", options: ["47,XYY", "47,XXY", "45,X (XO)", "45,Y (YO)"], answer: 2, explanation: "تنتج متلازمة تيرنر غالبًا عن وجود نسخة واحدة من الكروموسوم X، ويكتب الطراز 45,X أو XO." },
  { id: "6ad0103163cd9c24f9f40efc", page: 123, number: 2, topic: "الوراثة - الاختلالات الكروموسومية", text: "ما الطراز الكروموسومي الشائع لمتلازمة كلاينفلتر؟", options: ["47,XXY", "45,Y", "45,X", "47,XYY"], answer: 0, explanation: "تنتج متلازمة كلاينفلتر الشائعة لدى الذكور عن وجود كروموسوم X إضافي، ويكتب الطراز 47,XXY." },
  { id: "6ad0103163cd9c24f9f40efd", page: 123, number: 3, topic: "الوراثة - الاختلالات الكروموسومية", text: "أي طراز كروموسومي جنسي من الخيارات غير قابل للحياة عادة؟", options: ["XXY", "XO", "OY", "XY"], answer: 2, explanation: "لا يمكن التطور الطبيعي عند غياب الكروموسوم X؛ لذلك لا يكون الطراز OY قابلًا للحياة." },
  { id: "6ad0103163cd9c24f9f40eff", page: 123, number: 5, topic: "الوراثة - أنماط السيادة", text: "عند تلقيح نبات أحمر نقي RR بنبات أبيض نقي rr في حالة السيادة غير التامة، ما نسبة أفراد الجيل الأول الوردية؟", options: ["100%", "75%", "50%", "25%"], answer: 0, explanation: "ينتج التزاوج RR × rr أفرادًا جميعهم Rr. وفي السيادة غير التامة يظهر الهجين لونًا وسيطًا ورديًا، لذا تكون النسبة 100%." },
  { id: "6ad0103163cd9c24f9f40f00", page: 123, number: 6, topic: "الوراثة - الاختلالات الكروموسومية", text: "ما المتلازمة الناتجة غالبًا عن وجود ثلاث نسخ من الكروموسوم 21؟", options: ["متلازمة كلاينفلتر", "متلازمة داون", "متلازمة تيرنر", "الجالكتوسيميا"], answer: 1, explanation: "تنتج متلازمة داون غالبًا عن تثلث الكروموسوم 21، أي وجود ثلاث نسخ منه." },
  { id: "6ad0103163cd9c24f9f40f01", page: 123, number: 7, topic: "الوراثة - الاضطرابات الوراثية", text: "ما الاضطراب الوراثي الذي يرتبط بزيادة مقاومة الملاريا في بعض المناطق الموبوءة؟", options: ["فقر الدم المنجلي", "المهاق", "الهيموفيليا", "الجالكتوسيميا"], answer: 0, explanation: "قد يمنح حمل أليل فقر الدم المنجلي حماية جزئية من الملاريا الشديدة، وهو مثال على ارتباط تكرار أليل وراثي بضغط بيئي." },
  { id: "6ad0103163cd9c24f9f40f02", page: 123, number: 8, topic: "الوراثة - الاضطرابات الوراثية", text: "أي جهاز يتأثر أساسًا بمرض هنتنغتون؟", options: ["الجهاز العصبي", "الجهاز التناسلي", "الجهاز التنفسي", "الجهاز الهضمي"], answer: 0, explanation: "مرض هنتنغتون اضطراب وراثي عصبي تنكسي يؤثر في خلايا الجهاز العصبي المركزي." },
  { id: "6ad0103163cd9c24f9f40f03", page: 123, number: 9, topic: "الوراثة - الاختلالات الكروموسومية", text: "يُظهر المخطط الكروموسومي ثلاث نسخ من الكروموسوم 21. ما التشخيص الموافق؟", options: ["متلازمة كلاينفلتر", "متلازمة تيرنر", "عمى الألوان", "متلازمة داون"], answer: 3, explanation: "وجود ثلاث نسخ للكروموسوم 21 هو تثلث الصبغي 21، ويرتبط بمتلازمة داون." },
  { id: "6ad0103163cd9c24f9f40f04", page: 123, number: 10, topic: "الوراثة - فصائل الدم", text: "ما الطراز الجيني لفصيلة الدم AB في نظام ABO؟", options: ["IAi", "IBi", "IAIB", "ii"], answer: 2, explanation: "تظهر فصيلة AB عند اجتماع الأليلين IA وIB، وهما متساويا السيادة." },
  { id: "6ad0103163cd9c24f9f40f05", page: 123, number: 11, topic: "الوراثة - فصائل الدم", text: "هل يمكن لشخص فصيلة دمه AB أن يكون والد طفل فصيلة دمه O في نظام ABO؟", options: ["نعم، باحتمال 100%", "نعم، باحتمال 50%", "نعم، باحتمال 25%", "لا، لأن فصيلة AB لا تحمل الأليل i اللازم لفصيلة O"], answer: 3, explanation: "يكون طراز صاحب فصيلة AB هو IAIB ولا يحمل الأليل i؛ لذا لا يستطيع توريث أليل i اللازم لطفل فصيلته O (ii)." },
  { id: "6ad0103163cd9c24f9f40f06", page: 124, number: 12, topic: "الوراثة - الاختلالات الكروموسومية", text: "ما الصيغة الكروموسومية لذكر مصاب بمتلازمة داون الناتجة عن تثلث الكروموسوم 21؟", options: ["44 + XY", "45 + XY", "43 + XY", "46 + XX"], answer: 1, explanation: "يحتوي الذكر المصاب بتثلث الكروموسوم 21 على 45 كروموسومًا جسميًا وXY، أي 47 كروموسومًا إجمالًا." },
  { id: "6ad0103163cd9c24f9f40f07", page: 124, number: 13, topic: "الوراثة - الاختلالات الكروموسومية", text: "أظهر النمط النووي لمولود ثلاث نسخ من الكروموسوم 21. ما المتلازمة المرتبطة بذلك؟", options: ["متلازمة داون", "متلازمة كلاينفلتر", "متلازمة تيرنر", "متلازمة بار"], answer: 0, explanation: "تثلث الكروموسوم 21 هو الاختلال الكروموسومي المرتبط بمتلازمة داون." },
  { id: "6ad0103163cd9c24f9f40f08", page: 124, number: 14, topic: "الوراثة - فصائل الدم", text: "أم فصيلة دمها A وأب فصيلته AB. أي فصيلة لا يمكن أن تكون لأحد أبنائهما في نظام ABO؟", options: ["AB", "A", "B", "O"], answer: 3, explanation: "لا يحمل الأب AB الأليل i؛ لذلك لا يمكن أن يرث الطفل أليل i من كلا الوالدين اللازم لتكوين فصيلة O." },
  { id: "6ad0103163cd9c24f9f40f09", page: 124, number: 15, topic: "الوراثة - الكروموسومات الجنسية", text: "في أي خلايا يظهر جسم بار عادة نتيجة تعطيل أحد كروموسومي X؟", options: ["الخلايا الجسمية للإناث", "الخلايا الجسمية للذكور", "الخلايا الجنسية للإناث", "الخلايا الجنسية للذكور"], answer: 0, explanation: "يتكون جسم بار من كروموسوم X غير نشط في كثير من الخلايا الجسمية التي تحتوي على أكثر من كروموسوم X." },
  { id: "6ad0103163cd9c24f9f40f0b", page: 124, number: 17, topic: "الوراثة - فصائل الدم", text: "في نقل كريات الدم الحمراء ضمن نظام ABO فقط، لماذا تعد فصيلة O مانحًا مناسبًا لفصائل ABO المختلفة؟", options: ["لأنها تحمل مضادات A على الكريات", "لأنها تحمل مضادات B على الكريات", "لأنها تحمل مضادات AB على الكريات", "لأن كرياتها لا تحمل مولدَي الضد A أو B"], answer: 3, explanation: "كريات الدم الحمراء من فصيلة O لا تحمل مولدَي الضد A أو B؛ ويقتصر هذا التبسيط على توافق نظام ABO ولا يغني عن فحص التوافق وعامل Rh." },
  { id: "6ad0103163cd9c24f9f40f0c", page: 124, number: 18, topic: "الوراثة - فصائل الدم", text: "فصيلة دم مولود O. أي زوج من فصائل الوالدين لا يمكنه إنجاب هذا المولود وفق نظام ABO؟", options: ["الأب A والأم B", "الأب AB والأم O", "الأب B والأم O", "الأب O والأم A"], answer: 1, explanation: "فصيلة O تتطلب أن يرث الطفل الأليل i من كل والد. صاحب فصيلة AB لا يحمل الأليل i، لذلك لا يمكن لهذا الزوج إنجاب طفل O." },
  { id: "6ad0103163cd9c24f9f40f0d", page: 125, number: 1, topic: "الوراثة - الصفات المتأثرة بالجنس", text: "أي صفة مما يأتي مثال معروف على صفة تتأثر بالهرمونات الجنسية ويختلف شيوع ظهورها بين الجنسين؟", options: ["الصلع النمطي", "فقر الدم المنجلي", "عمى الألوان", "الهيموفيليا"], answer: 0, explanation: "الصلع النمطي مثال مدرسي على صفة متأثرة بالجنس؛ قد يختلف نمط ظهورها بحسب الجنس والهرمونات، مع وجود عوامل وراثية وبيئية متعددة." },
  { id: "6ad0103163cd9c24f9f40f0e", page: 125, number: 2, topic: "الوراثة - الصفات المرتبطة بالجنس", text: "أي لونين يصعب على كثير من المصابين بعمى الألوان الأحمر والأخضر التمييز بينهما؟", options: ["الأحمر والأخضر", "الأصفر والأزرق", "البنفسجي والوردي", "الأبيض والأسود"], answer: 0, explanation: "أشيع أنواع اضطراب رؤية الألوان هو ضعف التمييز بين درجات الأحمر والأخضر." },
  { id: "6ad0103163cd9c24f9f40f10", page: 125, number: 4, topic: "الوراثة - الصفات المرتبطة بالجنس", text: "أب سليم من عمى الألوان وأم حاملة له. ما نسبة الإصابة المتوقعة بين الأبناء الذكور؟", options: ["25%", "50%", "75%", "100%"], answer: 1, explanation: "الأبناء الذكور يرثون Y من الأب وX من الأم؛ فإذا كانت الأم حاملة XᴮXᵇ، فاحتمال أن يرث الابن Xᵇ المصاب يساوي 50%." },
  { id: "6ad0103163cd9c24f9f40f11", page: 125, number: 5, topic: "الوراثة - الصفات المرتبطة بالجنس", text: "أب مصاب بعمى الألوان وأم حاملة له. ما العبارة الصحيحة عن الأبناء؟", options: ["جميع الأبناء مصابون", "جميع الأبناء سليمون", "جميع البنات مصابات", "نصف البنات حاملات للصفة، ونصفهن مصابات"], answer: 3, explanation: "يرث كل البنات X المصاب من الأب. ومن الأم الحاملة، ترث نصف البنات X سليمًا فيصبحن حاملات، وترث النصف الآخر X المصاب فيصبحن مصابات." },
  { id: "6ad0103163cd9c24f9f40f12", page: 125, number: 6, topic: "الوراثة - الاختلالات الكروموسومية", text: "ما الوصف الأدق للطراز الكروموسومي 47,XYY؟", options: ["متلازمة داون", "أنثى طبيعية", "متلازمة كلاينفلتر", "ذكر لديه كروموسوم Y إضافي"], answer: 3, explanation: "يمثل 47,XYY ذكرًا لديه نسخة إضافية من كروموسوم Y؛ ويختلف أثر ذلك بين الأفراد ولا يصح وصفه بعبارة «شبه طبيعي»." },
  { id: "6ad0103163cd9c24f9f40f13", page: 125, number: 7, topic: "الوراثة - الصفات المرتبطة بالجنس", text: "أب مصاب بعمى الألوان لديه ابنة سليمة تزوجت رجلًا سليمًا. بما أن الابنة ورثت X المصاب من أبيها فهي حاملة؛ فما احتمال إصابة طفل من أبنائها؟", options: ["100%", "70%", "50%", "25%"], answer: 3, explanation: "تزاوج XᴮXᵇ مع XᴮY يعطي احتمالًا واحدًا من أربعة لطفل مصاب XᵇY؛ أي 25% من مجموع الأبناء." },
  { id: "6ad0103163cd9c24f9f40f14", page: 125, number: 8, topic: "الوراثة - الصفات المرتبطة بالجنس", text: "ما الطراز الجيني لذكر مصاب بالهيموفيليا المرتبطة بالكروموسوم X؟", options: ["XᴴXʰ", "XᴴXᴴ", "XᴴY", "XʰY"], answer: 3, explanation: "يحمل الذكر كروموسوم X واحدًا وكروموسوم Y؛ وإذا حمل X أليل الهيموفيليا المتنحي Xʰ ظهر المرض، فيكون طرازه XʰY." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40efe", page: 123, number: 4, reason: "السؤال يكرر مباشرة السؤال السابق عن عدم قابلية الطراز OY للحياة، من دون إضافة مهارة أو سياق جديد." },
  { id: "6ad0103163cd9c24f9f40f0a", page: 124, number: 16, reason: "السؤال يكرر مباشرة السؤال 2 في الصفحة 123: الطراز 47,XXY ومتلازمة كلاينفلتر، من دون اختلاف في المهارة المطلوبة." },
  { id: "6ad0103163cd9c24f9f40f0f", page: 125, number: 3, reason: "السؤال مكرر مباشرة للسؤال 1 في الصفحة نفسها عن الصفة المتأثرة بالجنس ومثال الصلع." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const ids = [...approvals.map((item) => item.id), ...rejections.map((item) => item.id)];
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
  for (const item of rejections) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "rejected"].includes(draft.status)) failures.push(`q${item.number} p${item.page}: rejection source/page/status mismatch`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number} p${item.page}: rejected draft already has a published row`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approvals.length, rejected: rejections.length, changed: false };
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
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة مفتاح الإجابة والشرح مع المصدر، وفحص المخططات الكروموسومية والجداول عند ورودها.", updatedAt: reviewedAt,
    } });
  }
  for (const item of rejections) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "rejected"] } }, { $set: {
      status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.reason, updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
